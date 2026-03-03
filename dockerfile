# Dockerfile
FROM node:18-bullseye-slim

# Install Python dan build tools untuk sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (tanpa better-sqlite3)
RUN npm install --omit=dev

# Copy source code
COPY . .

# Create data directory
RUN mkdir -p /app/data && chmod 777 /app/data

# Create .env file from environment variables
RUN echo "BOT_TOKEN=${BOT_TOKEN}" > .env && \
    echo "BOT_USERNAME=${BOT_USERNAME}" >> .env && \
    echo "NODE_ENV=${NODE_ENV}" >> .env && \
    echo "DATABASE_URL=${DATABASE_URL}" >> .env && \
    echo "SUPER_ADMIN_IDS=${SUPER_ADMIN_IDS}" >> .env && \
    echo "SUPER_ADMIN_USERNAMES=${SUPER_ADMIN_USERNAMES}" >> .env && \
    echo "DEFAULT_CHANNEL_ID=${DEFAULT_CHANNEL_ID}" >> .env && \
    echo "DEFAULT_CHANNEL_LINK=${DEFAULT_CHANNEL_LINK}" >> .env && \
    echo "PROMO_LINK_PREDICTION=${PROMO_LINK_PREDICTION}" >> .env && \
    echo "PROMO_LINK_WHATSAPP=${PROMO_LINK_WHATSAPP}" >> .env && \
    echo "PROMO_LINK_TELEGRAM=${PROMO_LINK_TELEGRAM}" >> .env && \
    echo "PROMO_LINK_CLAIM=${PROMO_LINK_CLAIM}" >> .env && \
    echo "RATE_LIMIT_WINDOW=${RATE_LIMIT_WINDOW}" >> .env && \
    echo "RATE_LIMIT_MAX=${RATE_LIMIT_MAX}" >> .env && \
    echo "MAINTENANCE_MODE=${MAINTENANCE_MODE}" >> .env && \
    echo "LOG_LEVEL=${LOG_LEVEL}" >> .env && \
    echo "PORT=${PORT}" >> .env

# Run migrations
RUN node src/database/migrationRunner.js

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start command
CMD ["npm", "start"]
