"""
database.py — Database connection management.

Stores a single active connection per server session (in-memory).
Designed to be extended for multi-user / persistent connections later.
"""

from typing import Optional, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine


# ---------------------------------------------------------------------------
# In-memory session store (single connection for now)
# ---------------------------------------------------------------------------
_active_connection: Optional[Dict[str, Any]] = None


def set_connection(connection_string: str) -> Engine:
    """
    Create and store a SQLAlchemy engine for the given connection string.
    Raises on invalid connection.
    """
    global _active_connection

    # Attempt to connect — will raise if credentials are bad
    engine = create_engine(connection_string, pool_pre_ping=True)

    # Verify the connection is live
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))

    _active_connection = {
        "engine": engine,
        "connection_string": connection_string,
        # Derive a safe display string (hide password)
        "display_string": _mask_password(connection_string),
    }
    return engine


def get_engine() -> Engine:
    """Return the active SQLAlchemy engine or raise if not connected."""
    if _active_connection is None:
        raise RuntimeError("No active database connection. Please connect first.")
    return _active_connection["engine"]


def get_connection_info() -> Optional[Dict[str, Any]]:
    """Return connection metadata (without the engine object)."""
    if _active_connection is None:
        return None
    return {
        "display_string": _active_connection["display_string"],
        "connected": True,
    }


def disconnect():
    """Dispose the active engine and clear the session."""
    global _active_connection
    if _active_connection:
        _active_connection["engine"].dispose()
        _active_connection = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _mask_password(connection_string: str) -> str:
    """Replace the password in a DB URL with ***."""
    try:
        from urllib.parse import urlparse, urlunparse
        parsed = urlparse(connection_string)
        if parsed.password:
            masked = parsed._replace(
                netloc=parsed.netloc.replace(parsed.password, "***")
            )
            return urlunparse(masked)
    except Exception:
        pass
    return connection_string
