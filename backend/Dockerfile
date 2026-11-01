# Production Dockerfile for Dhruv Pharma Backend
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Create uploads directories
RUN mkdir -p uploads/prescriptions uploads/order_prescriptions

EXPOSE 8000

# Run uvicorn server in production
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
