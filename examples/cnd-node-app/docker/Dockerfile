FROM oven/bun:alpine AS prod-deps-env
WORKDIR /app
COPY ./package.json ./bun.lock ./
RUN bun install --frozen-lockfile --prod

FROM oven/bun:alpine AS build-env
WORKDIR /app
COPY ./package.json ./bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM oven/bun:alpine AS runner
WORKDIR /app
RUN apk add --no-cache curl
COPY ./package.json .
COPY --from=prod-deps-env /app/node_modules /app/node_modules
COPY --from=build-env /app/dist /app/dist
CMD ["bun", "dist/index.js"]
EXPOSE 3000
