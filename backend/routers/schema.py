"""
routers/schema.py — Endpoint to retrieve the database schema.
"""

from fastapi import APIRouter, HTTPException

import database
from schema_extractor import extract_schema
from schemas import SchemaResponse

router = APIRouter()


@router.get("/schema", response_model=SchemaResponse)
async def get_schema():
    """
    Extract and return the full schema (tables + columns) of the connected database.
    """
    try:
        engine = database.get_engine()
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        tables = extract_schema(engine)
        return SchemaResponse(tables=tables)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schema extraction failed: {e}")
