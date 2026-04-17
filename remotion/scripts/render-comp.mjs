import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// CLI: node render-comp.mjs <compositionId> <outputPath> [--still <frame>]
const compId = process.argv[2] ?? "add-procedure";
const outputPath = process.argv[3] ?? `/mnt/documents/${compId}.mp4`;
const stillIdx = process.argv.indexOf("--still");
const stillFrame = stillIdx > -1 ? Number(process.argv[stillIdx + 1]) : null;

console.log(`Bundling… composition=${compId}, out=${outputPath}, still=${stillFrame}`);

const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
});

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: {
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  },
  chromeMode: "chrome-for-testing",
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: compId,
  puppeteerInstance: browser,
});

if (stillFrame !== null && !Number.isNaN(stillFrame)) {
  await renderStill({
    composition,
    serveUrl: bundled,
    output: outputPath,
    frame: stillFrame,
    puppeteerInstance: browser,
  });
  console.log(`Still saved: ${outputPath}`);
} else {
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation: outputPath,
    puppeteerInstance: browser,
    muted: true,
    concurrency: 1,
  });
  console.log(`Video saved: ${outputPath}`);
}

await browser.close({ silent: false });
