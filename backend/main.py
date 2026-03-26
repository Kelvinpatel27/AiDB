"""
AI Natural Language Database Manager - FastAPI Backend
Entry point for the application. Configures middleware, routes, and startup.
"""

import os



from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from routers import connection, query, schema, history

load_dotenv()
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    print("🚀 AI DB Manager starting up...")
    yield
    print("🛑 AI DB Manager shutting down...")


app = FastAPI(
    title="AI Natural Language Database Manager",
    description="Convert natural language queries to SQL and execute them on your database.",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS Middleware — allow the React dev server to call the API
# ---------------------------------------------------------------------------
allowed_origins =os.getenv("CORS_ALLOWED_ORIGINS")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(connection.router, prefix="/api", tags=["Connection"])
app.include_router(schema.router,     prefix="/api", tags=["Schema"])
app.include_router(query.router,      prefix="/api", tags=["Query"])
app.include_router(history.router,    prefix="/api", tags=["History"])


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "AI DB Manager API is running"}
