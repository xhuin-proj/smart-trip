from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from core.config_loader import settings
from routers.search import router as search_router
from routers.itinerary import router as itinerary_router
from routers.places import router as places_router
from routers.auth import auth_router
from routers.user import user_router
from routers.onboarding import router as onboarding_router

app = FastAPI(title="SmartTrip AI Backend")

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth_router, prefix="/api")
app.include_router(user_router, prefix="/api", tags=["Users"])
app.include_router(onboarding_router)

# dashboard routes
app.include_router(places_router)
app.include_router(search_router)

# AI itinerary builder
app.include_router(itinerary_router)


@app.get("/health")
def health():
    return {"status": "ok"}
