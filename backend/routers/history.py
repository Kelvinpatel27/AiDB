"""
routers/history.py — Query history endpoints.
"""

from fastapi import APIRouter
from schemas import HistoryResponse
from models import history_store

router = APIRouter()


@router.get("/history", response_model=HistoryResponse)
async def get_history():
    """Return all past queries (newest first)."""
    return HistoryResponse(entries=history_store.all())


@router.delete("/history")
async def clear_history():
    """Clear the entire query history."""
    history_store.clear()
    return {"message": "History cleared."}
