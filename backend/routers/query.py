"""
routers/query.py — Endpoints for AI SQL generation and execution.
"""

from fastapi import APIRouter, HTTPException
from sqlalchemy.exc import SQLAlchemyError

import database
from ai_service import natural_language_to_sql
from schema_extractor import extract_schema, schema_to_text
from sql_executor import execute_sql
from schemas import (
    GenerateSQLRequest,
    GenerateSQLResponse,
    ExecuteRequest,
    ExecuteResponse,
)
from models import history_store

router = APIRouter()


@router.post("/generate-sql", response_model=GenerateSQLResponse)
async def generate_sql(body: GenerateSQLRequest):
    """
    Convert a natural language query into SQL using the AI service.

    Steps:
    1. Extract live schema from the connected DB.
    2. Send schema + user query to the LLM.
    3. Return the generated SQL (does NOT execute it).
    """
    try:
        engine = database.get_engine()
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Build schema context for the LLM
    try:
        tables = extract_schema(engine)
        schema_text = schema_to_text(tables)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schema extraction failed: {e}")

    if not tables:
        raise HTTPException(
            status_code=400,
            detail="The connected database has no tables. Please check your connection.",
        )

    # Call the AI service
    try:
        sql, explanation = await natural_language_to_sql(body.query, schema_text)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {e}")

    return GenerateSQLResponse(sql=sql, explanation=explanation)


@router.post("/execute", response_model=ExecuteResponse)
async def execute(body: ExecuteRequest):
    """
    Execute a SQL statement on the connected database.

    The Pydantic validator on ExecuteRequest blocks dangerous DDL.
    Results are returned as columns + rows JSON.
    """
    try:
        engine = database.get_engine()
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        result = execute_sql(engine, body.sql)
        # Record success in history
        history_store.add(
            natural_language="(direct execution)",
            sql=body.sql,
            status="success",
            row_count=result.row_count,
        )
        return result
    except ValueError as e:
        # Blocked SQL
        raise HTTPException(status_code=400, detail=str(e))
    except SQLAlchemyError as e:
        history_store.add(
            natural_language="(direct execution)",
            sql=body.sql,
            status="error",
            error_message=str(e),
        )
        raise HTTPException(status_code=400, detail=f"SQL error: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query", response_model=dict)
async def full_query_pipeline(body: GenerateSQLRequest):
    """
    Combined endpoint: NL → SQL → execute in one shot.
    Returns both the generated SQL and the execution result.
    Saves to history.
    """
    try:
        engine = database.get_engine()
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Generate SQL
    tables = extract_schema(engine)
    schema_text = schema_to_text(tables)

    try:
        sql, explanation = await natural_language_to_sql(body.query, schema_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {e}")

    # Execute
    try:
        result = execute_sql(engine, sql)
        history_store.add(
            natural_language=body.query,
            sql=sql,
            status="success",
            row_count=result.row_count,
        )
        return {
            "sql": sql,
            "explanation": explanation,
            "result": result.model_dump(),
        }
    except Exception as e:
        history_store.add(
            natural_language=body.query,
            sql=sql,
            status="error",
            error_message=str(e),
        )
        raise HTTPException(status_code=400, detail=str(e))
