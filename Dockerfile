# Paso 1: Compilar la aplicación usando Node.js
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --configuration=production

# Paso 2: Servir la app usando Nginx
FROM nginx:alpine
# ⚠️ CAMBIA 'tu-nombre-de-proyecto' por el nombre exacto del paso 1
COPY --from=build /app/dist/tu-nombre-de-proyecto /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]