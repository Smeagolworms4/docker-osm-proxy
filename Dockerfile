FROM node:lts-alpine

MAINTAINER Damien Duboeuf <smeagolworms4@gmail.com>

ADD src /usr/share/openstreetmap-proxy/src
ADD package.json /usr/share/openstreetmap-proxy/tsconfig.json
ADD package.json /usr/share/openstreetmap-proxy/package.json
ADD package-lock.json /usr/share/openstreetmap-proxy/package-lock.json

WORKDIR /usr/share/openstreetmap-proxy

RUN npm install && npm run build && rm -r node_modules && npm install --only=prod

WORKDIR /usr/share/openstreetmap-proxy/dist

RUN mkdir -p /var/cache/openstreetmap-proxy && chown node:node /var/cache/openstreetmap-proxy

USER node

ENV OSM_PROXY_PORT=80
ENV OSM_PROXY_CACHE_PATH=/var/cache/openstreetmap-proxy
ENV OSM_PROXY_LAYER_URL=http://{s}.{type}.openstreetmap.org/{z}/{x}/{y}.png
ENV OSM_PROXY_CACHE_LIFETIME=2592000

EXPOSE 80

CMD node index.js $OSM_PROXY_PORT $OSM_PROXY_CACHE_PATH $OSM_PROXY_LAYER_URL $OSM_PROXY_CACHE_LIFETIME
