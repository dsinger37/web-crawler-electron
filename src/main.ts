import { CheerioCrawler } from "crawlee";
import { BrowserWindow, Menu, MenuItem, app, dialog, globalShortcut, ipcMain } from "electron";
import { createWriteStream } from "fs";
import path from "path";
import { SitemapStream } from "sitemap";
import { logger } from "./logger";
import { template } from "./menuTemplate";
import { checkAndParseSitemap } from "./sitemapUtils";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: BrowserWindow | null;
let crawler: CheerioCrawler | null = null;
let isCrawlCancelled = false;
// TODO: Add a setting to enable/disable this in one of the menu items
const logEachPageCrawled = false;

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open DevTools in development mode and allow toggling it with CmdOrCtrl+num0
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
    globalShortcut.register("CmdOrCtrl+num0", () => {
      mainWindow?.webContents.toggleDevTools();
    });
  }

  // Override the shortcut for opening developer tools
  globalShortcut.register("CmdOrCtrl+Shift+I", () => {
    return;
  });
};

// Create the about window
const createAboutWindow = () => {
  const aboutWindow = new BrowserWindow({
    width: 300,
    height: 200,
    show: true,
    parent: mainWindow,
    modal: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  aboutWindow.maximizable = false;
  aboutWindow.resizable = false;
  aboutWindow.minimizable = false;
  aboutWindow.setMenu(null);

  if (process.env.NODE_ENV === "development") {
    aboutWindow.webContents.openDevTools();
  }

  if (ABOUT_WINDOW_VITE_DEV_SERVER_URL) {
    console.log("loading vite dev server");
    aboutWindow.loadURL(`${ABOUT_WINDOW_VITE_DEV_SERVER_URL}`);
  } else {
    aboutWindow.loadFile(path.join(__dirname, `../renderer/${ABOUT_WINDOW_VITE_NAME}/index.html`));
  }
};

const aboutMenuItem = new MenuItem({
  label: "About",
  click: createAboutWindow,
});

// Add the "About" menu item to the "Help" menu
const helpMenu = menu.items.find((item) => item.role === "help");
if (helpMenu) {
  helpMenu.submenu.append(aboutMenuItem);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle("check-sitemap", async (event, websiteUrl: string) => {
  const pageCount = await checkAndParseSitemap(websiteUrl);
  return pageCount;
});

ipcMain.handle("crawl-website", async (event, websiteUrl: string, maxRequests: number, maxConcurrency: number, urlsToExclude: string[]) => {
  const crawledUrls: string[] = [];
  const discoveredUrls: Set<string> = new Set();

  logger.info("----------------------------- New crawl request received -----------------------------");
  logger.info(`Starting crawl for website: ${websiteUrl}`);

  const defaultAllowedContentTypes = ["text/html", "application/xhtml+xml"];
  // Add any additional content types to be allowed here, don't forget to also remove their extensions from ignoredExtensionsPattern in the requestHandler
  const additionalAllowedContentTypes = ["application/json"];
  const allowedContentTypes = [...defaultAllowedContentTypes, ...additionalAllowedContentTypes];

  crawler = new CheerioCrawler({
    maxRequestsPerCrawl: maxRequests,
    maxConcurrency,
    additionalMimeTypes: additionalAllowedContentTypes,
    preNavigationHooks: [
      async (crawlingContext, gotoOptions) => {
        const { request } = crawlingContext;
        const response = await fetch(request.url, { method: "HEAD" });
        const contentType = response.headers.get("content-type");

        // NOTE: This check will make sure that only supported content types are crawled (e.g. the default content types and any additional ones added to the additionalAllowedContentTypes array). This is to prevent crawling content types that were missed in the ignoredExtensionsPattern in the requestHandler.
        if (contentType && !allowedContentTypes.some((type) => contentType.includes(type))) {
          logger.info(`Skipping link with unsupported content type: ${request.url}`);
          return false;
        }

        return gotoOptions;
      },
    ],
    async requestHandler({ request, enqueueLinks, $ }) {
      if (isCrawlCancelled) {
        return;
      }

      logEachPageCrawled && logger.info(`Crawling page: ${request.url}`);
      crawledUrls.push(request.url);

      const ignoredExtensionsPattern =
        /\.(pdf|jpg|jpeg|png|gif|svg|mp4|mp3|zip|rar|gz|tar|iso|dmg|exe|msi|bin|7z|apk|torrent|webp|woff|woff2|ttf|otf|eot|ico|css|js|json|xml|csv|xls|xlsx|doc|docx|ppt|pptx)$/i;

      const links = $("a[href]")
        .map((_, el) => $(el).attr("href"))
        .get()
        .filter((href) => !ignoredExtensionsPattern.test(href));
      const filteredLinks = links.filter((link) => {
        return !urlsToExclude.some((urlSegment) => {
          const urlSegmentPattern = new RegExp(`^${websiteUrl}/${urlSegment}(/|$)`);
          // TODO: Add a log message here to show which URLs are being excluded. This should probably be sent to a different file than the main log file to keep the main log file clean.
          return urlSegmentPattern.test(link);
        });
      });

      // Discovered Urls could possibly be much larger than crawled Urls because it includes all the <a> tags that have an href attribute.
      // We're not adding excluded URLs to the discoveredUrls set because they're not going to be crawled.
      // This is just to give the user an idea of how many URLs were found on the website. If we want to include excluded URLs in the count, we can do that by using "links" instead of "filteredLinks".
      // NOTE: We could possibly add a setting to include/exclude excluded URLs from the discovered URL count
      filteredLinks.forEach((link) => discoveredUrls.add(link));

      await enqueueLinks({
        // TODO: Add a setting to enable crawling subdomains using the "same-hostname" strategy
        strategy: "same-origin",
        urls: filteredLinks,
      });
      event.sender.send("crawl-progress", crawledUrls.length, discoveredUrls.size, isCrawlCancelled);
    },
    failedRequestHandler: async ({ request }) => {
      logger.error(`Request ${request.url} failed too many times`);
    },
  });

  await crawler.run([websiteUrl]);

  if (isCrawlCancelled) {
    logger.info(`Crawl cancelled by the user. Pages crawled before cancellation: ${crawledUrls.length}`);
    isCrawlCancelled = false;
    return { pageCount: crawledUrls.length, discoveredUrlCount: discoveredUrls.size, crawledUrls };
  } else {
    logger.info(`Crawl completed. Pages crawled: ${crawledUrls.length}`);
  }

  // NOTE: Not using this for now, but it's here for future use
  // await Dataset.pushData({ crawledUrls });
  return { pageCount: crawledUrls.length, discoveredUrlCount: discoveredUrls.size, crawledUrls };
});

ipcMain.on("cancel-crawl", () => {
  if (crawler) {
    logger.info("Crawl cancellation requested by the user");
    isCrawlCancelled = true;
    crawler.autoscaledPool?.abort();
  }
});

ipcMain.on("generate-sitemap", async (event, websiteUrl, crawledUrls: string[]) => {
  const { filePath } = await dialog.showSaveDialog({
    defaultPath: "sitemap.xml",
    filters: [{ name: "XML Files", extensions: ["xml"] }],
  });

  if (filePath) {
    const sitemapStream = new SitemapStream({ hostname: websiteUrl });
    const writeStream = createWriteStream(filePath);

    sitemapStream.pipe(writeStream);

    crawledUrls.forEach((url) => {
      sitemapStream.write({ url });
    });

    sitemapStream.end();

    writeStream.on("finish", () => {
      logger.info(`Sitemap generated and saved to ${filePath}`);
    });
  }
});
