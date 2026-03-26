"""
routers/connection.py — Endpoints for connecting / disconnecting a database.
"""

from fastapi import APIRouter, HTTPException
from sqlalchemy.exc import OperationalError, ArgumentError

import database
from schemas import ConnectRequest, ConnectResponse

router = APIRouter()


@router.post("/connect", response_model=ConnectResponse)
async def connect(body: ConnectRequest):
    """
    Connect to a database using the provided connection string.
    Validates the connection and stores the engine in memory.
    """
    try:
        engine = database.set_connection(body.connection_string)
        info = database.get_connection_info()
        return ConnectResponse(
            success=True,
            message="Connected successfully.",
            display_string=info["display_string"] if info else None,
        )
    except ArgumentError as e:
        raise HTTPException(status_code=400, detail=f"Invalid connection string: {e}")
    except OperationalError as e:
        raise HTTPException(status_code=400, detail=f"Could not connect: {e.orig}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/disconnect", response_model=ConnectResponse)
async def disconnect():
    """Disconnect the active database session."""
    database.disconnect()
    return ConnectResponse(success=True, message="Disconnected.")


@router.get("/connection-status")
async def connection_status():
    """Return current connection metadata."""
    info = database.get_connection_info()
    if info is None:
        return {"connected": False}
    return info
