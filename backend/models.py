"""
models.py — In-memory data stores.

For production, replace the HistoryStore with a real database table.
"""

from datetime import datetime, timezone
from typing import List, Optional
from schemas import HistoryEntry


class HistoryStore:
    """
    Thread-safe (GIL-protected) in-memory list of executed queries.
    Replace with an async DB repository for production use.
    """

    def __init__(self) -> None:
        self._entries: List[HistoryEntry] = []
        self._counter: int = 0

    def add(
        self,
        natural_language: str,
        sql: str,
        status: str,
        error_message: Optional[str] = None,
        row_count: Optional[int] = None,
    ) -> HistoryEntry:
        self._counter += 1
        entry = HistoryEntry(
            id=self._counter,
            natural_language=natural_language,
            sql=sql,
            status=status,
            error_message=error_message,
            row_count=row_count,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
        self._entries.append(entry)
        return entry

    def all(self) -> List[HistoryEntry]:
        """Return entries newest-first."""
        return list(reversed(self._entries))

    def clear(self) -> None:
        self._entries.clear()
        self._counter = 0


# Singleton instance shared across request handlers
history_store = HistoryStore()
