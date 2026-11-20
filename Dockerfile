FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
# Production runs pending migrations on start (see app.module.ts migrationsRun).
ENV NODE_ENV=production PORT=5002
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
# Seed scripts (npm run db:seed:core) need these inside the container.
COPY --from=build /app/scripts ./scripts
EXPOSE 5002
CMD ["node", "dist/main.js"]
