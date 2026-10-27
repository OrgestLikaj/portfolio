# Imazh i prodhimit për çdo platformë që ekzekuton kontejnerë (Render, Fly.io, VPS me Docker...).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG SITE_URL=https://gegaattorney.al
ARG ALLOW_INDEXING=false
ENV SITE_URL=$SITE_URL ALLOW_INDEXING=$ALLOW_INDEXING
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=8080 HOST=0.0.0.0
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json /app/server.mjs ./
USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
