FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY import-service ./import-service
USER node
CMD ["node", "import-service/server.mjs"]
