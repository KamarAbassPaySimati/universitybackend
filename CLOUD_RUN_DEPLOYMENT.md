# Google Cloud Run Deployment Guide

## Prerequisites
1. Install Google Cloud CLI: https://cloud.google.com/sdk/docs/install
2. Create a Google Cloud Project
3. Enable required APIs

## Setup Steps

### 1. Install Google Cloud CLI
Download and install from: https://cloud.google.com/sdk/docs/install

### 2. Login and Setup
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 3. Enable Required APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 4. Deploy to Cloud Run

#### Option A: Direct Deploy (Recommended)
```bash
cd university-backend
gcloud run deploy university-backend \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10
```

#### Option B: Using Cloud Build
```bash
gcloud builds submit --config cloudbuild.yaml
```

### 5. Set Environment Variables
```bash
gcloud run services update university-backend \
  --region us-central1 \
  --set-env-vars="MONGODB_URI=your_mongodb_uri,JWT_SECRET=your_jwt_secret,NODE_ENV=production"
```

### 6. Get Service URL
```bash
gcloud run services describe university-backend --region us-central1 --format 'value(status.url)'
```

## Environment Variables to Set
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your JWT secret key
- `NODE_ENV`: production
- `PORT`: 8080 (automatically set by Cloud Run)

## Custom Domain (Optional)
1. Map custom domain in Cloud Run console
2. Update DNS records as instructed

## Monitoring
- View logs: `gcloud run logs tail university-backend --region us-central1`
- Monitor in Cloud Console: https://console.cloud.google.com/run

## Cost Optimization
- Cloud Run charges only for actual usage
- First 2 million requests per month are free
- Automatic scaling to zero when not in use