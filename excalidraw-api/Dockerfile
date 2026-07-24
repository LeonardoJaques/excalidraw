FROM node:22-alpine

WORKDIR /app
COPY package.json .
RUN npm install --omit=dev
COPY server.js .

HEALTHCHECK CMD node -e "require('http').get('http://localhost/excalidraw/api/library', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

EXPOSE 80

CMD ["node", "server.js"]
