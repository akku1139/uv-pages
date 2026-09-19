<p align="center"><img src="https://raw.githubusercontent.com/titaniumnetwork-dev/Ultraviolet-Static/main/public/uv.png" height="200"></p>

<h1 align="center">Ultraviolet-Static</h1>

Static files/assets used to spin up an Ultraviolet website.

## Install in [Ultraviolet-App](https://github.com/titaniumnetwork-dev/Ultraviolet-App.git)

See [Ultraviolet-App's Wiki](https://github.com/titaniumnetwork-dev/Ultraviolet-App/wiki/Customizing-your-frontend).

## Usage outside of Ultraviolet-App/Static hosting

### Build

The runtime files are generated from the pinned pnpm dependencies. Install dependencies and bundle the frontend into `dist/` with:

```sh
pnpm install --frozen-lockfile
pnpm build
```

The build copies the static frontend and local `public/uv/uv.config.js` into `dist/`, then bundles `public/index.js` with esbuild. Serve `dist/` as the site root.

### Transport

The frontend selects Epoxy over Wisp first. The Wisp endpoint is configured in `public/uv/uv.config.js` and defaults to the same origin at `/wisp/`, using `wss://` on HTTPS pages and `ws://` on local HTTP pages. If WebSocket support is unavailable, the endpoint cannot be opened, or Epoxy cannot initialize, BareMux switches to the Bare transport.

The fallback server is configured in `public/uv/uv.config.js`:

```js
wisp: "/wisp/",
bare: "https://example.com/bare/",
```

A Wisp server must accept WebSocket upgrades at the configured endpoint. A Bare server is only needed for the fallback path.
