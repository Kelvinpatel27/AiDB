"""
schemas.py — Pydantic models for request/response validation.
"""

from typing import Any, List, Optional, Dict
from pydantic import BaseModel, field_validator
import re


# ---------------------------------------------------------------------------
# Connection
# ---------------------------------------------------------------------------

class ConnectRequest(BaseModel):
    connection_string: str

    @field_validator("connection_string")
    @classmethod
    def validate_scheme(cls, v: str) -> str:
        allowed_schemes = ("postgresql", "postgres", "mysql", "sqlite")
        if not any(v.startswith(s) for s in allowed_schemes):
            raise ValueError(
                "Only PostgreSQL, MySQL, and SQLite connection strings are supported."
            )
        return v


class ConnectResponse(BaseModel):
    success: bool
    message: str
    display_string: Optional[str] = None


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

class ColumnInfo(BaseModel):
    name: str
    type: str
    nullable: bool
    primary_key: bool
    foreign_key: Optional[str] = None


class TableInfo(BaseModel):
    name: str
    columns: List[ColumnInfo]


class SchemaResponse(BaseModel):
    tables: List[TableInfo]


# ---------------------------------------------------------------------------
# Query generation
# ---------------------------------------------------------------------------

class GenerateSQLRequest(BaseModel):
    query: str  # Natural language query

    @field_validator("query")
    @classmethod
    def non_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Query cannot be empty.")
        return v.strip()


class GenerateSQLResponse(BaseModel):
    sql: str
    explanation: Optional[str] = None


# ---------------------------------------------------------------------------
# SQL execution
# ---------------------------------------------------------------------------

class ExecuteRequest(BaseModel):
    sql: str

    @field_validator("sql")
    @classmethod
    def check_allowed(cls, v: str) -> str:
        """Block dangerous DDL / admin statements."""
        normalized = re.sub(r"\s+", " ", v.strip().upper())

        blocked_patterns = [
            r"\bDROP\s+DATABASE\b",
            r"\bDROP\s+TABLE\b",
            r"\bTRUNCATE\b",
            r"\bALTER\s+SYSTEM\b",
            r"\bCREATE\s+DATABASE\b",
            r"\bDROP\s+SCHEMA\b",
        ]

        for pattern in blocked_patterns:
            if re.search(pattern, normalized):
                raise ValueError(
                    f"Blocked: This SQL contains a disallowed operation. "
                    f"Only SELECT, INSERT, UPDATE, and DELETE are permitted."
                )
        return v.strip()


class ExecuteResponse(BaseModel):
    columns: List[str]
    rows: List[List[Any]]
    row_count: int
    affected_rows: Optional[int] = None  # For INSERT/UPDATE/DELETE


# ---------------------------------------------------------------------------
# Query History
# ---------------------------------------------------------------------------

class HistoryEntry(BaseModel):
    id: int
    natural_language: str
    sql: str
    status: str          # "success" | "error"
    error_message: Optional[str] = None
    row_count: Optional[int] = None
    timestamp: str


class HistoryResponse(BaseModel):
    entries: List[HistoryEntry]
