FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install

# Build the app
COPY frontend/ ./
RUN yarn build

# Stage 2 - Serve with Nginx
FROM nginx:alpine

# Copy built frontend
COPY --from=build /app/dist /usr/share/nginx/html

# 🔥 Add custom Nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
