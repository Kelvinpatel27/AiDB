"""
schema_extractor.py — Inspects a live database and returns structured schema info.

Uses SQLAlchemy's Inspector API so it works with PostgreSQL, MySQL, and SQLite.
"""

from typing import List
from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from schemas import ColumnInfo, TableInfo


def extract_schema(engine: Engine) -> List[TableInfo]:
    """
    Reflect all tables and their columns from the connected database.
    Returns a list of TableInfo objects (used by the API and the AI prompt).
    """
    inspector = inspect(engine)
    tables: List[TableInfo] = []

    for table_name in inspector.get_table_names():
        columns = []

        # Collect primary key names for this table
        pk_constraint = inspector.get_pk_constraint(table_name)
        pk_columns = set(pk_constraint.get("constrained_columns", []))

        # Collect foreign keys: column → referenced table.column
        fk_map = {}
        for fk in inspector.get_foreign_keys(table_name):
            for local_col, ref_col in zip(
                fk["constrained_columns"], fk["referred_columns"]
            ):
                fk_map[local_col] = f"{fk['referred_table']}.{ref_col}"

        for col in inspector.get_columns(table_name):
            columns.append(
                ColumnInfo(
                    name=col["name"],
                    type=str(col["type"]),
                    nullable=col.get("nullable", True),
                    primary_key=col["name"] in pk_columns,
                    foreign_key=fk_map.get(col["name"]),
                )
            )

        tables.append(TableInfo(name=table_name, columns=columns))

    return tables


def schema_to_text(tables: List[TableInfo]) -> str:
    """
    Convert schema to a compact text representation suitable for LLM prompts.

    Example output:
        Table: users
          - id (INTEGER) [PK]
          - name (VARCHAR) nullable
          - email (VARCHAR)
    """
    lines = []
    for table in tables:
        lines.append(f"Table: {table.name}")
        for col in table.columns:
            flags = []
            if col.primary_key:
                flags.append("PK")
            if col.nullable:
                flags.append("nullable")
            if col.foreign_key:
                flags.append(f"FK→{col.foreign_key}")
            flag_str = f" [{', '.join(flags)}]" if flags else ""
            lines.append(f"  - {col.name} ({col.type}){flag_str}")
        lines.append("")  # blank line between tables
    return "\n".join(lines)
