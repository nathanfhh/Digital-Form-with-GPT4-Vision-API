# Stage 1: Build
FROM node:16-slim AS builder

WORKDIR /app
RUN apt-get update && apt-get install -y ca-certificates
ADD . /app
RUN npm install
RUN npm run build

# Stage 2: Run nginx
FROM nginx:1.25.3-alpine AS release

COPY --from=builder /app/dist /usr/share/nginx/html
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY ./nginx/proxy_common.conf /etc/nginx/proxy_common.conf
