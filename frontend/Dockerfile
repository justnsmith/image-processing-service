FROM node:20-alpine AS build
 WORKDIR /app
 COPY frontend/package.json frontend/yarn.lock ./
 RUN yarn install
 COPY frontend/ ./
 RUN yarn build
 FROM nginx:alpine
 COPY --from=build /app/dist /usr/share/nginx/html
 EXPOSE 80
 CMD ["nginx", "-g", "daemon off;"]
