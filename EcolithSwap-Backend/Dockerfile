FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Initialize database
RUN node setup-simple-db.js

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
