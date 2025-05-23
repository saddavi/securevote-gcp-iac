# Use Node 18 as base image for better compatibility (avoid Alpine musl-libc issues)
# Explicitly use linux/amd64 platform for Cloud Run compatibility
FROM --platform=linux/amd64 node:18-slim

# Create app directory
WORKDIR /app

# Install Cloud SQL Proxy
RUN apt-get update && apt-get install -y wget && \
    wget https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.1/cloud-sql-proxy.linux.amd64 -O /usr/local/bin/cloud-sql-proxy \
    && chmod +x /usr/local/bin/cloud-sql-proxy

# Install build dependencies and production dependencies
COPY package*.json ./

# Install Python and build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 make g++ procps && \
    # Install all production dependencies (including bcrypt) and build native modules inside the container
    npm ci --only=production && \
    # Explicitly rebuild bcrypt for linux/amd64 architecture with better compatibility
    npm rebuild bcrypt --build-from-source --update-binary && \
    # Verify bcrypt can be loaded
    node -e "try { require('bcrypt'); console.log('bcrypt loaded successfully'); } catch(e) { console.error('bcrypt not working:', e); process.exit(1); }" && \
    # Clean up to reduce image size
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy application code
COPY . .

# Set production environment
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 8080

# Copy and set permissions for startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Start the application using our startup script
CMD ["/app/start.sh"]
