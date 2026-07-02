FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# URL fake só para o prisma generate não barrar o build
RUN DATABASE_URL="postgresql://fake:fake@localhost:5432/fake" npx prisma generate

RUN npm run build

RUN ls -la dist/

EXPOSE 4000

CMD ["node", "dist/main.js"]