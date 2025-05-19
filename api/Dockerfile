# Use Node 18 Alpine as base image for smaller size
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install Cloud SQL Proxy
RUN wget https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.1/cloud-sql-proxy.linux.amd64 -O /usr/local/bin/cloud-sql-proxy \
    && chmod +x /usr/local/bin/cloud-sql-proxy

# Install production dependencies first
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Set production environment
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 8080

# Start the application with Cloud SQL Proxy
CMD ["sh", "-c", "cloud-sql-proxy --unix-socket /cloudsql ${DB_CONNECTION_NAME} & npm start"]
