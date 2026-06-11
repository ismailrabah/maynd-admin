# Dockerfile for Maynd.ma Admin
# Multi-stage build for production

# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY client/package.json client/nuxt.config.ts client/tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY client/ ./client/
COPY server/ ./server/

# Build the client
RUN cd client && npm run build

# Stage 2: Production image
FROM node:20-alpine AS production

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/client/.output ./output
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/package.json ./package.json

# Install only production dependencies
RUN npm ci --only=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server/src/index.ts"]