FROM node:20-alpine AS builder

WORKDIR /app

COPY packages/sdk ./packages/sdk
COPY apps/demo/package.json ./apps/demo/

WORKDIR /app/packages/sdk
RUN npm install && npm run build

WORKDIR /app/apps/demo
RUN npm install

COPY apps/demo ./

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3001

COPY --from=builder /app/apps/demo/public ./public
COPY --from=builder /app/apps/demo/.next/standalone ./
COPY --from=builder /app/apps/demo/.next/static ./.next/static

EXPOSE 3001
CMD ["node", "server.js"]
