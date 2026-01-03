FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install
RUN cd backend && npm install
RUN cd frontend && npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN cd backend && npx prisma generate

# Build frontend
RUN cd frontend && npm run build

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
