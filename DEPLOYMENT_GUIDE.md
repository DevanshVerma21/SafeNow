# SafeNow Project Deployment Guide

## Overview
Your SafeNow project consists of:
- **Backend**: FastAPI application with PostgreSQL database (already hosted)
- **Frontend**: React application
- **Database**: PostgreSQL on Render (already configured)

## Quick Deployment Options

### Option 1: Render (Recommended - Free tier available)

#### Backend Deployment on Render

1. **Create a Render account** at https://render.com

2. **Create a new Web Service**:
   - Connect your GitHub repository
   - Select the SafeNow repository
   - Use these settings:
     - **Name**: `safenow-backend`
     - **Environment**: `Docker` or `Python`
     - **Build Command**: `pip install -r backend/requirements.txt`
     - **Start Command**: `uvicorn backend.app:app --host 0.0.0.0 --port $PORT`
     - **Instance Type**: Free (or paid for better performance)

3. **Environment Variables**:
   ```
   DATABASE_URL=postgresql://safenow:1PenObnY5UVYgwX6nVd8O6zTJTvG9kTj@dpg-d3k11cndiees738rddag-a.oregon-postgres.render.com/safenow
   JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
   ENVIRONMENT=production
   PORT=10000
   REDIS_URL=redis://red-xxx:6379 (create a Redis instance)
   ```

4. **Deploy**: Click "Create Web Service"

#### Frontend Deployment on Render

1. **Create a Static Site**:
   - **Name**: `safenow-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`

2. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://safenow-backend.onrender.com
   REACT_APP_WEBSOCKET_URL=wss://safenow-backend.onrender.com
   ```

### Option 2: Heroku

#### Backend on Heroku

```bash
# Install Heroku CLI
# Create a new Heroku app
heroku create safenow-backend

# Set environment variables
heroku config:set DATABASE_URL="postgresql://safenow:1PenObnY5UVYgwX6nVd8O6zTJTvG9kTj@dpg-d3k11cndiees738rddag-a.oregon-postgres.render.com/safenow"
heroku config:set JWT_SECRET_KEY="your-super-secret-jwt-key"
heroku config:set ENVIRONMENT="production"

# Add Redis addon
heroku addons:create heroku-redis:mini

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

#### Frontend on Vercel/Netlify

**Vercel**:
```bash
# Install Vercel CLI
npm i -g vercel

# In frontend directory
cd frontend
vercel

# Set environment variables in Vercel dashboard:
# REACT_APP_API_URL=https://safenow-backend.herokuapp.com
```

### Option 3: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Deploy backend
railway up

# Set environment variables
railway variables set DATABASE_URL="postgresql://safenow:1PenObnY5UVYgwX6nVd8O6zTJTvG9kTj@dpg-d3k11cndiees738rddag-a.oregon-postgres.render.com/safenow"
railway variables set ENVIRONMENT="production"
```

## Step-by-Step Commands

### 1. Prepare Your Project

```bash
# Navigate to your project
cd d:\heloooooooo\SafeNow

# Create production environment file
cp .env.example .env

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Test backend locally
python -m backend.app

# Install frontend dependencies
cd ../frontend
npm install

# Build frontend
npm run build
```

### 2. Deploy to Render (Detailed Steps)

#### Backend:
1. Go to https://render.com and sign up/login
2. Click "New +" → "Web Service"
3. Connect GitHub and select your SafeNow repository
4. Configure:
   - **Name**: `safenow-backend`
   - **Root Directory**: `/` (leave empty)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.app:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables (in Render dashboard):
   - `DATABASE_URL`: Your PostgreSQL URL
   - `JWT_SECRET_KEY`: A secure random string
   - `ENVIRONMENT`: `production`
6. Click "Create Web Service"

#### Frontend:
1. In Render dashboard, click "New +" → "Static Site"
2. Connect the same repository
3. Configure:
   - **Name**: `safenow-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
4. Add Environment Variables:
   - `REACT_APP_API_URL`: `https://safenow-backend.onrender.com`
   - `REACT_APP_WEBSOCKET_URL`: `wss://safenow-backend.onrender.com`
5. Click "Create Static Site"

### 3. Post-Deployment Steps

1. **Update CORS settings** in your backend to allow your frontend domain
2. **Set up Redis** if using real-time features
3. **Configure custom domains** if needed
4. **Set up monitoring** and error tracking

## Environment Variables Summary

### Backend (.env):
```
DATABASE_URL=postgresql://safenow:1PenObnY5UVYgwX6nVd8O6zTJTvG9kTj@dpg-d3k11cndiees738rddag-a.oregon-postgres.render.com/safenow
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
ENVIRONMENT=production
PORT=8000
REDIS_URL=redis://localhost:6379
```

### Frontend (.env):
```
REACT_APP_API_URL=https://your-backend-url.onrender.com
REACT_APP_WEBSOCKET_URL=wss://your-backend-url.onrender.com
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Testing Deployment

After deployment, test these endpoints:
- `https://your-backend-url/docs` - FastAPI documentation
- `https://your-backend-url/health` - Health check
- `https://your-frontend-url` - Main application

## Troubleshooting

1. **Build failures**: Check build logs in platform dashboard
2. **Database connection**: Verify DATABASE_URL is correct
3. **CORS errors**: Update CORS settings in backend
4. **Environment variables**: Ensure all required variables are set

## Cost Estimates

### Free Tiers:
- **Render**: Free tier with limitations
- **Heroku**: Limited free hours
- **Railway**: $5/month after trial
- **Vercel/Netlify**: Free for personal projects

### Paid Options:
- **Render**: $7/month for backend, Free for frontend
- **Heroku**: $7/month for each dyno
- **Railway**: Usage-based pricing