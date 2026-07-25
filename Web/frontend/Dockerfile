# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Use relative API paths so nginx proxy handles /api/* requests
RUN VITE_API_BASE_URL="" npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=build /build/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
