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

ENV NODE_ENV=production

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled code from the builder stage
COPY --from=builder /app/dist ./dist

# Run as non-root user for security
USER node

# Start the application
CMD ["npm", "start"]
