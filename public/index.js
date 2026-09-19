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

const uvConfig = globalThis.__uv$config;

const bareMuxWorkerUrl = new URL(
  "baremux/worker.js",
  document.baseURI,
).toString();

const epoxyTransportUrl = new URL(
  "epoxy/index.mjs",
  document.baseURI,
).toString();

const bareTransportUrl = new URL(
  "bare/index.mjs",
  document.baseURI,
).toString();

const bareMux = new globalThis.BareMux.BareMuxConnection(
  bareMuxWorkerUrl,
);

function resolveWispUrl() {
  const url = new URL(uvConfig.wisp || "/wisp/", location.href);

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

function isWispPacket(data) {
  let bytes;

  if (data instanceof ArrayBuffer) {
    bytes = new Uint8Array(data);
  } else if (ArrayBuffer.isView(data)) {
    bytes = new Uint8Array(
      data.buffer,
      data.byteOffset,
      data.byteLength,
    );
  } else {
    return null;
  }

  if (bytes.byteLength < 5) return null;

  const streamId =
    new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    ).getUint32(1, true);

  return {
    type: bytes[0],
    streamId,
    payload: bytes.subarray(5),
  };
}

async function canUseWisp() {
  if (typeof WebSocket !== "function") {
    return false;
  }

  return new Promise((resolve) => {
    let settled = false;
    let socket;

    const timeout = setTimeout(() => finish(false), 5000);

    function finish(result) {
      if (settled) return;

      settled = true;
      clearTimeout(timeout);

      if (socket) {
        socket.close();
      }

      resolve(result);
    }

    try {
      // The protocol value itself is unspecified by Wisp v2.
      // Its presence selects the v2 handshake.
      socket = new WebSocket(wispUrl, "wisp-v2");

      socket.addEventListener(
        "message",
        async (event) => {
          let data = event.data;

          if (data instanceof Blob) {
            try {
              data = await data.arrayBuffer();
            } catch {
              finish(false);
              return;
            }
          }

          const packet = isWispPacket(data);

          if (!packet || packet.streamId !== 0) {
            finish(false);
            return;
          }

          // Wisp v2: INFO packet, major version 2.
          if (
            packet.type === 0x05 &&
            packet.payload.byteLength >= 2 &&
            packet.payload[0] === 2
          ) {
            finish("v2");
            return;
          }

          // Wisp v1 fallback.
          if (
            packet.type === 0x03 &&
            packet.payload.byteLength === 4
          ) {
            finish("v1");
            return;
          }

          finish(false);
        },
        { once: true },
      );

      socket.addEventListener(
        "error",
        () => finish(false),
        { once: true },
      );

      socket.addEventListener(
        "close",
        () => finish(false),
        { once: true },
      );
    } catch {
      finish(false);
    }
  });
}

async function configureTransport() {
  const wispVersion = await canUseWisp();

  if (wispVersion) {
    try {
      await bareMux.setTransport(
        epoxyTransportUrl,
        [{
          wisp: wispUrl,
          wisp_v2: wispVersion === "v2",
        }],
      );

      return "wisp";
    } catch (err) {
      console.warn(
        "Wisp transport initialization failed; falling back to Bare.",
        err,
      );
    }
  }

  await bareMux.setTransport(
    bareTransportUrl,
    [uvConfig.bare],
  );

  return "bare";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await globalThis.registerSW();

    const transport = await configureTransport();
    console.info(`Using ${transport} transport`);
  } catch (err) {
    error.textContent =
      "Failed to initialize the proxy transport.";
    errorCode.textContent = String(err?.stack || err);
    return;
  }

  const url = globalThis.search(
    address.value,
    searchEngine.value,
  );

  location.href =
    uvConfig.prefix +
    uvConfig.encodeUrl(url);
});
