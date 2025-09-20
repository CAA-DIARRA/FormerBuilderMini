FROM node:20-alpine

WORKDIR /usr/src/app

# Nécessaire pour Prisma
RUN apk add --no-cache libc6-compat

# Installer dépendances
COPY package*.json ./
RUN npm ci

# Copier le reste du code
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Exposer le port
EXPOSE 3000

# La commande finale est définie par docker-compose.yml