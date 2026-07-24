FROM node:22 AS build

WORKDIR /opt/node_app

COPY . .

# do not ignore optional dependencies:
# Error: Cannot find module @rollup/rollup-linux-x64-gnu
RUN yarn install --frozen-lockfile --network-timeout 600000

ARG NODE_ENV=production
ARG VITE_APP_BASE_PATH=/
ENV VITE_APP_BASE_PATH=$VITE_APP_BASE_PATH

RUN yarn build:app:docker

FROM nginx:1.27-alpine

COPY --from=build /opt/node_app/excalidraw-app/build /usr/share/nginx/html
COPY nginx-excalidraw.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=5s --start-period=5s CMD wget -q -O /dev/null http://localhost || exit 1
