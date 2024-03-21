import { CheerioCrawler, Dataset } from "crawlee";
import { BrowserWindow, app, dialog, ipcMain } from "electron";
import { createWriteStream } from "fs";
import path from "path";
import { SitemapStream } from "sitemap";
import { checkAndParseSitemap } from "./sitemapUtils";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

let mainWindow: BrowserWindow | null;

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

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.handle("check-sitemap", async (event, websiteUrl: string) => {
  const pageCount = await checkAndParseSitemap(websiteUrl);
  return pageCount;
});

let crawler: CheerioCrawler | null = null;
let isCrawlCancelled = false;

ipcMain.handle("crawl-website", async (event, websiteUrl: string, maxRequests: number, maxConcurrency: number) => {
  const crawledUrls: string[] = [];
  const discoveredUrls: Set<string> = new Set();

  crawler = new CheerioCrawler({
    maxRequestsPerCrawl: maxRequests,
    maxConcurrency,
    async requestHandler({ request, enqueueLinks, $ }) {
      if (isCrawlCancelled) {
        return;
      }
      console.log(`Crawling page: ${request.url}`);
      crawledUrls.push(request.url);

      const links = $("a[href]")
        .map((_, el) => $(el).attr("href"))
        .get();

      links.forEach((link) => discoveredUrls.add(link));

      await enqueueLinks({
        strategy: "same-origin",
      });
      event.sender.send("crawl-progress", crawledUrls.length, discoveredUrls.size, isCrawlCancelled);
    },
    failedRequestHandler: async ({ request }) => {
      console.error(`Request ${request.url} failed too many times`);
    },
  });

  await crawler.run([websiteUrl]);

  if (isCrawlCancelled) {
    console.log("Crawl was cancelled by the user");
    isCrawlCancelled = false;
    return { pageCount: crawledUrls.length, discoveredUrlCount: discoveredUrls.size, crawledUrls };
  }

  await Dataset.pushData({ crawledUrls });

  return { pageCount: crawledUrls.length, discoveredUrlCount: discoveredUrls.size, crawledUrls };
});

ipcMain.on("cancel-crawl", () => {
  if (crawler) {
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
      console.log(`Sitemap generated and saved to ${filePath}`);
    });
  }
});
