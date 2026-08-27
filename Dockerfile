# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies including dev dependencies for building
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Production environment
FROM node:20-alpine

# Install Chromium and dependencies
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

# Tell Puppeteer to use the installed Chromium and not download its own
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
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

# Run as non-root user
USER node

# Start the application
CMD ["npm", "start"]
