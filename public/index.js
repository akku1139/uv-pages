"use strict";
/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("uv-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("uv-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("uv-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("uv-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("uv-error-code");
const bareMuxWorkerUrl = new URL(
  "baremux/worker.js",
  document.baseURI
).toString();
const epoxyTransportUrl = new URL(
  "epoxy/index.mjs",
  document.baseURI
).toString();
const bareTransportUrl = new URL("bare/index.mjs", document.baseURI).toString();
const bareMux = new BareMux.BareMuxConnection(bareMuxWorkerUrl);

function resolveWispUrl() {
  const url = new URL(__uv$config.wisp || "/wisp/", location.href);
  if (
    url.protocol === "http:" ||
    url.protocol === "https:" ||
    url.protocol === "ws:"
  ) {
    url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
  }
  return url.toString();
}

const wispUrl = resolveWispUrl();

function canUseWisp() {
  if (typeof WebSocket !== "function") return Promise.resolve(false);

  return new Promise((resolve) => {
    let settled = false;
    let socket;
    const timeout = setTimeout(() => finish(false), 5000);

    function finish(result) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket?.close();
      resolve(result);
    }

    try {
      socket = new WebSocket(wispUrl);
      socket.addEventListener("open", () => finish(true), { once: true });
      socket.addEventListener("error", () => finish(false), { once: true });
      socket.addEventListener("close", () => finish(false), { once: true });
    } catch {
      finish(false);
    }
  });
}

async function configureTransport() {
  if (await canUseWisp()) {
    try {
      await bareMux.setTransport(epoxyTransportUrl, [{ wisp: wispUrl }]);
      return;
    } catch {}
  }

  await bareMux.setTransport(bareTransportUrl, [__uv$config.bare]);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await registerSW();
    await configureTransport();
  } catch (err) {
    error.textContent = "Failed to initialize the proxy transport.";
    errorCode.textContent = err.toString();
    return;
  }

  const url = search(address.value, searchEngine.value);
  location.href = __uv$config.prefix + __uv$config.encodeUrl(url);
});
