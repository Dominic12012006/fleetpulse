"""
FleetPulse Backend API — Main Application Entrypoint
"""

from datetime import datetime, timezone
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from starlette.responses import Response

from apps.api.core.config import settings
from apps.api.routers import alerts, analytics, audit, auth, copilot, fleet, live, maintenance

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("fleetpulse.api")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Connected Vehicle Intelligence Platform — Telemetry Ingestion, Predictive Fleet Reliability & Command Centre API",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus Metrics Instrumentation
REQUEST_COUNT = Counter("api_requests_total", "Total API HTTP requests", ["method", "endpoint", "status_code"])
REQUEST_LATENCY = Histogram("api_request_duration_seconds", "HTTP request latency in seconds", ["endpoint"])


@app.middleware("http")
async def prometheus_and_error_middleware(request: Request, call_next):
    start_time = datetime.now(timezone.utc)
    endpoint = request.url.path

    try:
        response = await call_next(request)
        status_code = response.status_code
    except Exception as exc:
        logger.exception(f"Unhandled server error on {endpoint}: {exc}")
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        response = JSONResponse(
            status_code=status_code,
            content={
                "error": "Internal Server Error",
                "message": "An unexpected error occurred while processing the request.",
                "path": endpoint
            }
        )

    duration = (datetime.now(timezone.utc) - start_time).total_seconds()
    REQUEST_COUNT.labels(method=request.method, endpoint=endpoint, status_code=status_code).inc()
    REQUEST_LATENCY.labels(endpoint=endpoint).observe(duration)
    return response


# Include API v1 Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(fleet.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(maintenance.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(copilot.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(live.router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["System Health"])
async def health_check():
    """Health check for load balancers and container orchestrators."""
    return {
        "status": "healthy",
        "service": "fleetpulse-api",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.get("/metrics", tags=["System Health"])
async def metrics():
    """Prometheus metrics scrape endpoint."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
