# Arcade 3D: Next.js app + multiplayer ws relay on one port.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY next.config.mjs ./
COPY server ./server
# server/prod.mjs listens on $PORT (default 3000) and serves the relay at /mp
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server/prod.mjs"]
