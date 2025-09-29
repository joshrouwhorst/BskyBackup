# syntax=docker/dockerfile:1
FROM node:24 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:24 AS builder
WORKDIR /app
COPY . .
RUN npm install --os=linux --cpu=arm64 sharp
RUN npm run lint || true
RUN npm rebuild
RUN npm run build
    

FROM node:24 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/src ./src
EXPOSE 3000
CMD ["npm", "run", "start"]
