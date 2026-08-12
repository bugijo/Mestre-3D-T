FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund || npm ci --no-audit --no-fund

COPY . .
RUN npm run build || true

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund || npm ci --no-audit --no-fund

COPY --from=build /app/dist ./dist
COPY server ./server
COPY .env.example ./

EXPOSE 10000

CMD ["node", "server/lan-server.mjs"]
