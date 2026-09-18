import { copyFile, cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = resolve(root, "public");
const distDir = resolve(root, "dist");

const assets = [
  ["uv/sw.js", "@titaniumnetwork-dev/ultraviolet/dist/sw.js"],
  ["uv/uv.bundle.js", "@titaniumnetwork-dev/ultraviolet/dist/uv.bundle.js"],
  ["uv/uv.client.js", "@titaniumnetwork-dev/ultraviolet/dist/uv.client.js"],
  ["uv/uv.handler.js", "@titaniumnetwork-dev/ultraviolet/dist/uv.handler.js"],
  ["uv/uv.sw.js", "@titaniumnetwork-dev/ultraviolet/dist/uv.sw.js"],
  ["baremux/index.js", "@mercuryworkshop/bare-mux/dist/index.js"],
  ["baremux/worker.js", "@mercuryworkshop/bare-mux/dist/worker.js"],
  ["epoxy/index.mjs", "@mercuryworkshop/epoxy-transport/dist/index.mjs"],
  ["bare/index.mjs", "@mercuryworkshop/bare-transport/dist/index.mjs"],
];

await rm(distDir, { force: true, recursive: true });
await cp(publicDir, distDir, { recursive: true });

await Promise.all(
  assets.map(async ([destinationFile, packageFile]) => {
    const destination = resolve(distDir, destinationFile);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(resolve(root, "node_modules", packageFile), destination);
  })
);

await esbuild.build({
  bundle: true,
  entryPoints: [resolve(publicDir, "index.js")],
  format: "iife",
  minify: true,
  outfile: resolve(distDir, "index.js"),
  platform: "browser",
  sourcemap: "linked",
  target: "es2020",
});
