FROM python:3.13-slim

# Build arguments for versioning
ARG VERSION=dev
ARG BUILD_DATE=unknown

# Set environment variables for version info
ENV APP_VERSION=${VERSION} \
    APP_BUILD_DATE=${BUILD_DATE}

WORKDIR /app

# Install system fonts for Polish character support
RUN apt-get update && apt-get install -y \
    fonts-dejavu-core \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app

# Label the image with version information
LABEL version="${VERSION}" \
      buildDate="${BUILD_DATE}" \
      description="Werbisci Lublin App - Backend"

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
