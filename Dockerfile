# Stage 1: Build
FROM node:20-bullseye AS builder

WORKDIR /app

# Install dependencies including dev dependencies for building
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Production environment
FROM node:20-bullseye

# Install Chromium and necessary fonts
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the installed Chromium and not download its own
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    WHATSAPP_DATA_PATH=/app/data/.wwebjs_auth

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled code from the builder stage
COPY --from=builder /app/dist ./dist

# Create a directory for WhatsApp data to be mounted and make it writable
RUN mkdir -p /app/data/.wwebjs_auth && chown -R node:node /app/data

# Run as non-root user (important for Puppeteer sandboxing)
USER node

# Start the application
CMD ["npm", "start"]
