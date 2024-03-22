import { CheerioCrawler } from "crawlee";
import { BrowserWindow, Menu, app, dialog, globalShortcut, ipcMain } from "electron";
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

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open DevTools in development mode and allow toggling it with the "0" numpad key
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
    globalShortcut.register("num0", () => {
      mainWindow?.webContents.toggleDevTools();
    });
  }

  // Override the shortcut for opening developer tools
  globalShortcut.register("CmdOrCtrl+Shift+I", () => {
    return;
  });
};

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

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

ipcMain.handle("check-sitemap", async (event, websiteUrl: string) => {
  const pageCount = await checkAndParseSitemap(websiteUrl);
  return pageCount;
});

ipcMain.handle("crawl-website", async (event, websiteUrl: string, maxRequests: number, maxConcurrency: number) => {
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

      // Discovered Urls could possibly be much larger than crawled Urls because it includes all the <a> tags that have an href attribute.
      links.forEach((link) => discoveredUrls.add(link));

      await enqueueLinks({
        // TODO: Add a setting to enable crawling subdomains using the "same-hostname" strategy
        strategy: "same-origin",
        urls: links,
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
