# Frontend Dockerfile (React/Next/Vite etc.)
FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

# Use serve to serve static build
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]
