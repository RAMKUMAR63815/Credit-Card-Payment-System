# Node.js version 22 with lightweight Alpine Linux image use pannrom
FROM node:22-alpine


# Docker container-kulla /app folder-ah working directory-ah set pannrom
WORKDIR /app


# package.json and package-lock.json files-ah /app-kulla copy pannrom
# npm dependencies install panna indha files thevai
COPY package*.json ./


# package.json-la irukkura dependencies ellam install pannrom
RUN npm install


# Frontend project-oda remaining files ellam /app-kulla copy pannrom
COPY . .


# Vite development server use panna port 5173 expose pannrom
EXPOSE 5173


# Container start aagumbodhu React/Vite development server run pannrom
# --host 0.0.0.0 = Docker container-ku veliya irundhum frontend access panna allow pannum
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]