# Docker configuration for frontend
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
