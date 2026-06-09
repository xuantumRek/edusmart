# Dockerfile for Frontend (Vite + React)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# We can inject API URL at build time or runtime. Vite requires it at build time for static embedding.
# But for a true "ready to deploy" changing only .env, we should use a runtime configuration or Nginx reverse proxy.
# Since VITE_API_URL is baked in at build time, in local docker-compose we map ports, so we will just build it.
RUN npm run build

FROM nginx:alpine
# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Add custom Nginx config to route React Router properly (fallback to index.html)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
