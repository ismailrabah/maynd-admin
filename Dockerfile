# Dockerfile for Maynd.ma Admin
# Multi-stage build for production with Bun

# Stage 1: Build the application
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY client/package.json client/nuxt.config.ts client/tsconfig.json ./
COPY server/package.json ./server/

# Install dependencies with Bun
RUN bun install

# Copy source files
COPY client/ ./client/
COPY server/ ./server/

# Set environment for build (required for vite-plugin-checker)
ENV NODE_ENV=development

# Build the client with Bun
RUN cd client && bun run build

# Stage 2: Production image
FROM oven/bun:1 AS production

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/client/.output ./output
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/package.json ./package.json
COPY --from=builder /app/server/package.json ./server/

# Install only production dependencies
RUN bun install --production

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
CMD ["bun", "run", "server/src/index.ts"]
