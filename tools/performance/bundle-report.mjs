import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const root = join(process.cwd(), "apps", "web", "dist");
if (!existsSync(root)) throw new Error("Build apps/web first with `pnpm --filter @accpocket/web build`.");
const files = [];
function walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name), stats = statSync(path);
    if (stats.isDirectory()) walk(path);
    else files.push({ path: relative(root, path).replaceAll("\\", "/"), raw: stats.size, gzip: gzipSync(readFileSync(path)).length, type: extname(path) });
  }
}
walk(root);
files.sort((left, right) => right.raw - left.raw);
console.table(files);
console.log(JSON.stringify({ files: files.length, rawBytes: files.reduce((sum, file) => sum + file.raw, 0), gzipBytes: files.reduce((sum, file) => sum + file.gzip, 0) }));
