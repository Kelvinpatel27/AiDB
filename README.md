# AI Natural Language Database Manager

> Ask your database questions in plain English. Get SQL. See results.

A full-stack developer tool that connects to your PostgreSQL (or MySQL/SQLite) database, extracts its schema, and lets you query it using natural language powered by an LLM.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  React Frontend (Vite + TailwindCSS)                        │
│  ┌──────────────┐ ┌──────────────────┐ ┌─────────────────┐ │
│  │ SchemaViewer │ │ QueryBox+Preview  │ │  ResultTable    │ │
│  └──────────────┘ └──────────────────┘ └─────────────────┘ │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API (Axios)
┌───────────────────────────▼─────────────────────────────────┐
│  FastAPI Backend                                            │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐  │
│  │  /connect    │ │ /generate-sql│ │  /execute          │  │
│  │  /schema     │ │ /history     │ │  /disconnect       │  │
│  └──────┬───────┘ └──────┬───────┘ └────────┬───────────┘  │
│         │                │                   │              │
│  ┌──────▼───────┐ ┌──────▼───────┐ ┌────────▼───────────┐  │
│  │  SQLAlchemy  │ │  OpenAI API  │ │  SQL Executor      │  │
│  │  (DB Engine) │ │  (LLM Layer) │ │  (Safety Guards)   │  │
│  └──────┬───────┘ └──────────────┘ └────────────────────┘  │
└─────────┼───────────────────────────────────────────────────┘
          │
    ┌─────▼──────────┐
    │  Your Database  │
    │  PostgreSQL /   │
    │  MySQL / SQLite │
    └────────────────┘
```

---

## Project Structure

```
ai-db-manager/
├── backend/
│   ├── main.py              # FastAPI app entry, CORS, router registration
│   ├── database.py          # Engine creation, in-memory session store
│   ├── schemas.py           # Pydantic request/response models + safety validators
│   ├── models.py            # In-memory query history store
│   ├── schema_extractor.py  # SQLAlchemy inspector → structured schema
│   ├── ai_service.py        # OpenAI integration — NL → SQL
│   ├── sql_executor.py      # Safe SQL execution with result serialisation
│   ├── requirements.txt
│   ├── .env.example
│   └── routers/
│       ├── connection.py    # POST /connect, POST /disconnect, GET /connection-status
│       ├── schema.py        # GET /schema
│       ├── query.py         # POST /generate-sql, POST /execute, POST /query
│       └── history.py       # GET /history, DELETE /history
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── services/
        │   └── api.js           # Axios instance + all API calls
        ├── pages/
        │   ├── ConnectDatabase.jsx  # Landing page
        │   └── Dashboard.jsx        # Main 3-panel workspace
        └── components/
            ├── SchemaViewer.jsx   # Collapsible table/column tree
            ├── QueryBox.jsx       # NL query textarea
            ├── SQLPreview.jsx     # SQL display with edit + execute
            ├── ResultTable.jsx    # Data table for results
            └── HistoryPanel.jsx   # Past queries list
```

---

## Setup Instructions

### Prerequisites

- Python 3.10+
- Node.js 18+
- An OpenAI API key
- A running PostgreSQL (or MySQL / SQLite) database

---

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY

# Start the server
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open: http://localhost:5173

---

### 3. Environment Variables

#### backend/.env

```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini          # optional, default: gpt-4o-mini
# OPENAI_BASE_URL=...             # optional: Azure/Ollama endpoint
```

---

## API Endpoints

| Method | Endpoint              | Description                              |
|--------|-----------------------|------------------------------------------|
| GET    | `/`                   | Health check                             |
| POST   | `/api/connect`        | Connect to a database                    |
| POST   | `/api/disconnect`     | Disconnect                               |
| GET    | `/api/connection-status` | Get current connection info           |
| GET    | `/api/schema`         | Extract and return DB schema             |
| POST   | `/api/generate-sql`   | Convert NL query → SQL (no execution)   |
| POST   | `/api/execute`        | Execute a SQL string                     |
| POST   | `/api/query`          | NL → SQL → execute (combined)           |
| GET    | `/api/history`        | Get query history                        |
| DELETE | `/api/history`        | Clear query history                      |

---

## Example Queries to Test

```
# READ
Show all users created this month
Find the top 5 customers by total order amount
Count how many orders each user has placed
Show products where price is greater than 50

# WRITE
Insert a new user named Alice with email alice@example.com
Update the price of product with id 1 to 99.99
Delete all orders from before 2020

# AGGREGATE
What is the average order value?
How many users registered each month this year?
Show the most expensive product in each category
```

---

## Safety Guards

The following SQL operations are **blocked** at the Pydantic validation layer AND in the executor:

- `DROP DATABASE`
- `DROP TABLE`
- `TRUNCATE`
- `ALTER SYSTEM`
- `CREATE DATABASE`
- `DROP SCHEMA`

Only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` are permitted.

---

## Adding MySQL Support

MySQL works out of the box. Use a connection string like:

```
mysql+pymysql://user:password@localhost:3306/mydb
```

`pymysql` is already included in `requirements.txt`.

---

## Production Considerations

- Replace the in-memory session store in `database.py` with Redis or a DB-backed session.
- Replace the `HistoryStore` in `models.py` with a proper database table.
- Add authentication (JWT / OAuth2) to all endpoints.
- Rate-limit the `/generate-sql` endpoint to control OpenAI costs.
- Use `uvicorn --workers 4` or deploy behind Gunicorn for concurrency.
