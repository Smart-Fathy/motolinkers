FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --config.onlyBuiltDependencies='["sharp","esbuild"]' || pnpm install --config.onlyBuiltDependencies='["sharp","esbuild"]'
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile --config.onlyBuiltDependencies='["sharp","esbuild"]' || pnpm install --prod --config.onlyBuiltDependencies='["sharp","esbuild"]'
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
