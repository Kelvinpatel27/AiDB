# """
# ai_service.py — Converts natural language queries into SQL using an LLM.

# Uses the OpenAI Chat Completions API (compatible with any OpenAI-compatible endpoint).
# The schema context is injected into the system prompt so the model can produce
# accurate, table-aware SQL.
# """

# import os
# import re
# from typing import Tuple
# from openai import AsyncOpenAI


# # ---------------------------------------------------------------------------
# # Client initialisation (uses OPENAI_API_KEY from environment)
# # ---------------------------------------------------------------------------
# _client: AsyncOpenAI | None = None


# def _get_client() -> AsyncOpenAI:
#     global _client
#     if _client is None:
#         api_key = os.getenv("OPENAI_API_KEY")
#         if not api_key:
#             raise RuntimeError(
#                 "OPENAI_API_KEY is not set. Add it to your .env file."
#             )
#         base_url = os.getenv("OPENAI_BASE_URL")  # optional override
#         _client = AsyncOpenAI(
#             api_key=api_key,
#             **({"base_url": base_url} if base_url else {}),
#         )
#     return _client


# # ---------------------------------------------------------------------------
# # System prompt template
# # ---------------------------------------------------------------------------
# SYSTEM_PROMPT = """You are an expert SQL assistant. Your sole job is to convert
# natural language questions into valid SQL statements for the given database schema.

# RULES:
# 1. Output ONLY the raw SQL — no markdown fences, no explanation, no comments.
# 2. Use only the tables and columns that exist in the schema below.
# 3. Never generate DROP DATABASE, DROP TABLE, TRUNCATE, ALTER SYSTEM, or CREATE DATABASE.
# 4. Prefer explicit column names over SELECT *.
# 5. Use standard SQL compatible with PostgreSQL.
# 6. If the question is ambiguous, make a reasonable assumption.
# 7. End every statement with a semicolon.

# DATABASE SCHEMA:
# {schema}
# """


# async def natural_language_to_sql(
#     user_query: str,
#     schema_text: str,
# ) -> Tuple[str, str]:
#     """
#     Call the LLM and return (sql, explanation).

#     Parameters
#     ----------
#     user_query   : The user's natural language request.
#     schema_text  : Plain-text schema produced by schema_extractor.schema_to_text().

#     Returns
#     -------
#     (sql, explanation) — sql is the generated statement; explanation is a
#     human-readable summary (extracted from a second model pass or inferred).
#     """
#     client = _get_client()
#     model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

#     system = SYSTEM_PROMPT.format(schema=schema_text)

#     response = await client.chat.completions.create(
#         model=model,
#         temperature=0,          # Deterministic output for SQL
#         max_tokens=512,
#         messages=[
#             {"role": "system", "content": system},
#             {"role": "user",   "content": user_query},
#         ],
#     )

#     raw_sql = response.choices[0].message.content or ""
#     sql = _clean_sql(raw_sql)

#     # Generate a brief explanation (second cheap call)
#     explanation = await _explain_sql(client, model, user_query, sql)

#     return sql, explanation


# async def _explain_sql(
#     client: AsyncOpenAI,
#     model: str,
#     user_query: str,
#     sql: str,
# ) -> str:
#     """Return a one-sentence plain-English explanation of what the SQL does."""
#     try:
#         resp = await client.chat.completions.create(
#             model=model,
#             temperature=0,
#             max_tokens=80,
#             messages=[
#                 {
#                     "role": "user",
#                     "content": (
#                         f"In one sentence, explain what this SQL does in plain English:\n{sql}"
#                     ),
#                 }
#             ],
#         )
#         return resp.choices[0].message.content or ""
#     except Exception:
#         return ""


# def _clean_sql(raw: str) -> str:
#     """Strip markdown fences and whitespace from the model output."""
#     # Remove ```sql ... ``` or ``` ... ```
#     raw = re.sub(r"```[a-zA-Z]*\n?", "", raw)
#     raw = raw.replace("```", "").strip()
#     return raw


"""
ai_service.py — Converts natural language queries into SQL using Google Gemini.

Uses the Google Generative AI SDK (gemini-1.5-flash by default).
"""

import os
import re
from typing import Tuple
from dotenv import load_dotenv
import google.generativeai as genai


# ---------------------------------------------------------------------------
# Client initialisation (uses GEMINI_API_KEY from environment)
# ---------------------------------------------------------------------------
_model = None


def _get_model():
    global _model
    load_dotenv()
    if _model is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Add it to your .env file."
            )
        genai.configure(api_key=api_key)
        model_name = os.getenv("GEMINI_MODEL")
        _model = genai.GenerativeModel(model_name)
    return _model


# ---------------------------------------------------------------------------
# System prompt template
# ---------------------------------------------------------------------------
# SYSTEM_PROMPT = """You are an expert SQL assistant. Your sole job is to convert
# natural language questions into valid SQL statements for the given database schema.

# RULES:
# 1. Output ONLY the raw SQL — no markdown fences, no explanation, no comments.
# 2. Use only the tables and columns that exist in the schema below.
# 3. Never generate DROP DATABASE, DROP TABLE, TRUNCATE, ALTER SYSTEM, or CREATE DATABASE.
# 4. Prefer explicit column names over SELECT *.
# 5. Use standard SQL compatible with PostgreSQL.
# 6. If the question is ambiguous, make a reasonable assumption.
# 7. End every statement with a semicolon.

# DATABASE SCHEMA:
# {schema}

# Now convert this request to SQL: {query}
# """
SYSTEM_PROMPT = """You are an expert SQL assistant. Your sole job is to convert
natural language questions into valid SQL statements for the given database schema.

STRICT RULES:
1. Output ONLY the raw SQL — no markdown fences, no explanation, no comments.
2. ONLY use tables and columns that are EXPLICITLY listed in the DATABASE SCHEMA below.But you have power to create new tables and schemas if needed to answer the question. You can also use CTEs to create temporary tables.
3. If it in not possible generate query based on given schema and question, output a SQL comment with the text "NO VALID SQL".
4. ALWAYS wrap table names and column names in double quotes exactly as they appear in the schema.
   Example: SELECT "id", "name" FROM "Friends";
5. Never generate DROP DATABASE, DROP TABLE, TRUNCATE, ALTER SYSTEM, or CREATE DATABASE.
6. Prefer explicit column names over SELECT *.
7. Use standard SQL compatible with PostgreSQL.
8. End every statement with a semicolon.

DATABASE SCHEMA (these are the ONLY tables and columns you may use):
{schema}

Now convert this request to SQL: {query}
"""


async def natural_language_to_sql(
    user_query: str,
    schema_text: str,
) -> Tuple[str, str]:
    """
    Call Gemini and return (sql, explanation).
    """
    model = _get_model()

    prompt = SYSTEM_PROMPT.format(schema=schema_text, query=user_query)

    # Gemini's generate_content is sync — run in thread to avoid blocking
    import asyncio
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None, lambda: model.generate_content(prompt)
    )

    raw_sql = response.text or ""
    sql = _clean_sql(raw_sql)

    # Generate explanation
    explanation = await _explain_sql(model, sql)

    return sql, explanation


async def _explain_sql(model, sql: str) -> str:
    """Return a one-sentence plain-English explanation of what the SQL does."""
    try:
        import asyncio
        loop = asyncio.get_event_loop()
        prompt = f"In one sentence, explain what this SQL does in plain English:\n{sql}"
        response = await loop.run_in_executor(
            None, lambda: model.generate_content(prompt)
        )
        return response.text or ""
    except Exception:
        return ""


def _clean_sql(raw: str) -> str:
    """Strip markdown fences and whitespace from the model output."""
    raw = re.sub(r"```[a-zA-Z]*\n?", "", raw)
    raw = raw.replace("```", "").strip()
    return raw