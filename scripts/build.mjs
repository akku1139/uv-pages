import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const assets = [
  ["@titaniumnetwork-dev/ultraviolet/dist/sw.js", "public/uv/sw.js"],
  [
    "@titaniumnetwork-dev/ultraviolet/dist/uv.bundle.js",
    "public/uv/uv.bundle.js",
  ],
  [
    "@titaniumnetwork-dev/ultraviolet/dist/uv.client.js",
    "public/uv/uv.client.js",
  ],
  [
    "@titaniumnetwork-dev/ultraviolet/dist/uv.handler.js",
    "public/uv/uv.handler.js",
  ],
  ["@titaniumnetwork-dev/ultraviolet/dist/uv.sw.js", "public/uv/uv.sw.js"],
  ["@mercuryworkshop/bare-mux/dist/index.js", "public/baremux/index.js"],
  ["@mercuryworkshop/bare-mux/dist/worker.js", "public/baremux/worker.js"],
  ["@mercuryworkshop/epoxy-transport/dist/index.mjs", "public/epoxy/index.mjs"],
  ["@mercuryworkshop/bare-transport/dist/index.mjs", "public/bare/index.mjs"],
];

for (const [source, destination] of assets) {
  const destinationPath = resolve(root, destination);
  await mkdir(dirname(destinationPath), { recursive: true });
  await copyFile(resolve(root, "node_modules", source), destinationPath);
}
