"""
sql_executor.py — Executes SQL against the active database connection.

Returns structured results (columns + rows) and handles DML row counts.
"""

import re
from typing import Any, Dict, List, Tuple, Optional
from sqlalchemy import text
from sqlalchemy.engine import Engine

from schemas import ExecuteResponse


# Statements that return rows
_SELECT_PATTERN = re.compile(r"^\s*SELECT\b", re.IGNORECASE)

# Blocked operations (defence-in-depth on top of Pydantic validator)
_BLOCKED = re.compile(
    r"\b(DROP\s+DATABASE|DROP\s+TABLE|TRUNCATE|ALTER\s+SYSTEM|CREATE\s+DATABASE|DROP\s+SCHEMA)\b",
    re.IGNORECASE,
)


def execute_sql(engine: Engine, sql: str) -> ExecuteResponse:
    """
    Execute *sql* on the given engine and return a structured response.

    For SELECT statements: returns column names and all rows.
    For INSERT/UPDATE/DELETE: returns affected row count.
    """
    # Final safety check
    if _BLOCKED.search(sql):
        raise ValueError("Blocked SQL operation detected.")

    with engine.connect() as conn:
        # Use a transaction so DML can be committed
        with conn.begin():
            result = conn.execute(text(sql))

            if _SELECT_PATTERN.match(sql):
                # SELECT — fetch all rows
                columns = list(result.keys())
                rows = [list(row) for row in result.fetchall()]
                # Convert non-serialisable types to string
                rows = [[_serialize(cell) for cell in row] for row in rows]
                return ExecuteResponse(
                    columns=columns,
                    rows=rows,
                    row_count=len(rows),
                )
            else:
                # DML — return affected rows
                affected = result.rowcount
                return ExecuteResponse(
                    columns=[],
                    rows=[],
                    row_count=0,
                    affected_rows=affected if affected >= 0 else None,
                )


def _serialize(value: Any) -> Any:
    """Convert DB-specific types to JSON-safe Python primitives."""
    import datetime, decimal
    if isinstance(value, (datetime.datetime, datetime.date, datetime.time)):
        return value.isoformat()
    if isinstance(value, decimal.Decimal):
        return float(value)
    if isinstance(value, bytes):
        return value.hex()
    return value
