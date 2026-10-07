# 🚀 Render Deployment Guide — Mule Account Detection

This repository contains everything needed to deploy the **FastAPI ML Inference Backend** and **Next.js Claymorphism Frontend** onto [Render.com](https://render.com).

---

## ⚡ Method 1: 1-Click Render Blueprint (Recommended)

Render Blueprints automatically deploy and link both services using [`render.yaml`](file:///C:/Users/sakth/.gemini/antigravity-ide/scratch/mule-account-detection/render.yaml).

### Steps:
1. Push your repository to **GitHub**.
2. Log into your [Render Dashboard](https://dashboard.render.com).
3. Click **"New +"** &rarr; select **"Blueprint"**.
4. Connect your GitHub repository (`mule-account-detection-`).
5. Render will detect `render.yaml` and configure:
   - **`mule-detection-backend`** (Python 3.11 / FastAPI / ML Models)
   - **`mule-detection-frontend`** (Node.js 20 / Next.js)
6. Click **"Apply"** & wait for the build to finish.
7. Open the generated frontend URL to use the live application!

---

## 🛠️ Method 2: Manual Web Service Setup on Render

If you prefer to configure the services manually on Render:

### 1. Deploy the Backend Service (FastAPI)
- Click **"New +"** &rarr; **"Web Service"**.
- Connect your GitHub repository.
- Configure settings:
  - **Name:** `mule-detection-backend`
  - **Runtime:** `Python 3`
  - **Root Directory:** `backend`
  - **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
  - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
  - **Health Check Path:** `/health`
- **Environment Variables:**
  - `PYTHON_VERSION` = `3.11.9`
  - `CORS_ORIGINS` = `*`
  - `DATABASE_URL` = `sqlite:///./mule_detection.db`

---

### 2. Deploy the Frontend Service (Next.js)
- Click **"New +"** &rarr; **"Web Service"**.
- Connect your GitHub repository.
- Configure settings:
  - **Name:** `mule-detection-frontend`
  - **Runtime:** `Node`
  - **Root Directory:** `web`
  - **Build Command:** `npm install && npm run build`
  - **Start Command:** `npm run start -- -p $PORT`
- **Environment Variables:**
  - `NODE_VERSION` = `20`
  - `BACKEND_URL` = `https://<YOUR-BACKEND-SERVICE-NAME>.onrender.com`
  - `NEXT_PUBLIC_API_URL` = `https://<YOUR-BACKEND-SERVICE-NAME>.onrender.com`

---

## 🐳 Method 3: Docker Deployment on Render

Both services include standalone production `Dockerfile`s:
- **Backend:** `backend/Dockerfile`
- **Frontend:** `web/Dockerfile`

To deploy with Docker on Render:
1. When creating a Web Service, choose **"Docker"** as the runtime.
2. Specify the **Docker Context** and **Dockerfile Path** (`backend/Dockerfile` or `web/Dockerfile`).

---

## 🧪 Local Testing with Docker Compose
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3005`
- Backend API Docs: `http://localhost:8000/docs`
