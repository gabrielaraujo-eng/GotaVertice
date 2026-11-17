FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package.json README.md ./
COPY public ./public
COPY server.js ./server.js
COPY data/.gitkeep ./data/.gitkeep

RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["npm", "start"]
