# =========================================================================
# Stage 1: Build the React 19 + Vite Frontend (PWA)
# =========================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Cache dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy project files and build static production bundle
COPY . .

# Optional build arguments for baked-in environment variables
ARG VITE_API_BASE
ARG VITE_WS_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_API_BASE=${VITE_API_BASE}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

RUN npm run build

# =========================================================================
# Stage 2: Python FastAPI ML Backend & Unified Application Server
# =========================================================================
FROM python:3.10-slim AS runner

WORKDIR /app

# Install system libraries needed by OpenCV & MediaPipe
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python ML & API dependencies
COPY ml_backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy FastAPI backend code and trained ML models
COPY ml_backend/ ./ml_backend/

# Copy compiled frontend from Stage 1 into the container
COPY --from=frontend-builder /app/dist ./dist

# Application environment configuration
ENV PYTHONUNBUFFERED=1
ENV FRONTEND_DIST=/app/dist
ENV PORT=10000

# Expose Render default web port
EXPOSE 10000

# Health check to ensure service readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

# Launch FastAPI with Uvicorn, dynamically binding to the port assigned by Render
WORKDIR /app/ml_backend
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
