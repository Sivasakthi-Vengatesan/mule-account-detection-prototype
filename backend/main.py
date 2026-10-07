import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from core.database import init_db
from utils.data_loader import seed_database_if_empty
from api.predict import router as predict_router
from api.accounts import router as accounts_router
from api.analytics import router as analytics_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("mule_detector.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Mule Account Detection Backend...")
    init_db()
    seed_database_if_empty()
    logger.info("Database initialized and ready.")
    yield
    logger.info("Shutting down Mule Account Detection Backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade AI API for Mule Account Detection, Risk Triage, and Explainability",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Endpoint
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": "mule-account-detection",
        "version": settings.VERSION
    }

# Also support /api/health
@app.get(f"{settings.API_PREFIX}/health", tags=["Health"])
def api_health_check():
    return {
        "status": "ok",
        "service": "mule-account-detection",
        "version": settings.VERSION
    }

# Include API Routers under /api
app.include_router(predict_router, prefix=settings.API_PREFIX)
app.include_router(accounts_router, prefix=settings.API_PREFIX)
app.include_router(analytics_router, prefix=settings.API_PREFIX)

# Also include directly at root prefix for flexibility
app.include_router(predict_router)
app.include_router(accounts_router)
app.include_router(analytics_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
