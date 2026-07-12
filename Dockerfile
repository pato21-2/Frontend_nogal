# Paso 1: Compilar la aplicación usando Node.js
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --configuration=production

# Paso 2: Servir la app usando Nginx
FROM nginx:alpine
# ✅ Cambiado de 'tu-nombre-de-proyecto' a 'nogal_a'
COPY --from=build /app/dist/nogal_a /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]