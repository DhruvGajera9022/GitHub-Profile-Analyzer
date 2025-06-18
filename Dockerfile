FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies including devDependencies for build
COPY package*.json ./
RUN npm ci

# Copy the full project
COPY . .

# Build the app
RUN npm run build

# Set environment
ENV NODE_ENV=production

# Expose app port
EXPOSE 5000

# Run the app
CMD ["node", "dist/app.js"]
