# Multi-stage build for Node.js
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first (for better caching)
COPY package.json package-lock.json tsconfig.json ./

# Install ALL dependencies (including dev deps for building)
RUN npm ci

# Copy source code
COPY src ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy built application and dependencies
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]