# syntax=docker/dockerfile:1
# =============================================================================
# samsary-web Dockerfile  (multi-stage)
# -----------------------------------------------------------------------------
# Stage 1 "build" : Node builds the Angular app into static files.
# Stage 2 "final" : nginx serves those static files and reverse-proxies the API.
# Build context   : ./samsary-web  (see docker-compose.yml)
# =============================================================================

# ---- Stage 1: build the Angular bundle ------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first (cached unless package*.json changes).
COPY package.json package-lock.json ./
RUN npm ci

# Build the production bundle (also generates the PWA service worker).
COPY . .
RUN npm run build

# ---- Stage 2: serve with nginx --------------------------------------------------
FROM nginx:1.27-alpine AS final

# Custom config: SPA fallback + reverse proxy for /api and /hubs (SignalR).
COPY nginx.conf /etc/nginx/conf.d/default.conf

# The @angular/build:application builder outputs to dist/<project>/browser.
COPY --from=build /app/dist/samsary-web/browser /usr/share/nginx/html

EXPOSE 80
