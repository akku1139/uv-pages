#! /bin/sh
wget "https://github.com/titaniumnetwork-dev/Ultraviolet/releases/download/v2.0.0/titaniumnetwork-dev-ultraviolet-2.0.0.tgz"
tar zxvf "titaniumnetwork-dev-ultraviolet-2.0.0.tgz"

cp package/dist/sw.js package/dist/uv.bundle.js package/dist/uv.client.js package/dist/uv.handler.js package/dist/uv.sw.js public/uv
