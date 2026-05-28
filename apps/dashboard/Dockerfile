FROM node:20-alpine AS builder

WORKDIR /app

COPY apps/dashboard/package.json apps/dashboard/package-lock.json ./

# Retry npm installs — Docker builds often hit transient ECONNRESET from the registry.
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm config set fetch-timeout 300000 \
  && for attempt in 1 2 3; do \
       npm ci && break; \
       if [ "$attempt" -eq 3 ]; then exit 1; fi; \
       echo "npm ci failed (attempt $attempt), retrying..."; \
       sleep 15; \
     done

COPY apps/dashboard/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
