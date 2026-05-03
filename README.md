# SMART TRIP

Smart Trip is a webapp where users can explore tourist destinations in Singapore, get personalized recommendations, and build day-by-day itineraries with the help of a large language model.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Security](#security)
- [API Documentation](#api-documentation)
- [Acknowledgements](#acknowledgements)
- [Contact](#contact)

---

## Features

| Feature                      | Description
| -----------------------------|------
| **Semantic Search**              | Uses vector embeddings (BAAI/bge-base-en-v1.5) to match user queries with relevant places by meaning and not just keywords, so that users can search naturally even if their terms don't match place names exactly.
| **Rule-based Intent Parsing**    | Analyzes user input to extract structured information such as category, budget, and interests, enabling more accurate and personalized search and itinerary recommendations.
| **AI-powered itinerary builder** | Uses Retrieval-Augmented Generation (RAG) with a local LLM (Ollama) to generate realistic, day-by-day travel plans from available places, tailored to user preferences and constraints.
| **User authentication**          | Secure login, signup, and session management using JWT tokens, ensuring only authorized users can access personalized features and dashboards.
| **Personalized Dashboard** | Central hub for searching and discovering new places. Place recommendations are ranked using vector similarity between user preferences and place embeddings.

---

## Demo
Login page:
![login page](demo/user/login.png)

Signup page:
![signup page](demo/user/signup.png)

Onboarding page:
![onboardingpage](demo/user/onboarding.png)
Video demo: [https://drive.google.com/file/d/1xlcu-aWi2h0q9Eo_PLoQGqZM-ADc8MAe/view?usp=sharing]

Search page & Dashboard page:
![search page](demo/search_dashboard/search.png)
![signup page](demo/search_dashboard/dashboard.png)
Video demo: [https://drive.google.com/file/d/1t8VOHsEg6-HnoJZJferSH8f0nh1P8qi6/view?usp=sharing]

Itinerary page:
promt: Plan a 1 day trip:
![itinerary1 page](demo/itinerary/itinerary1.png)

prompt: Plan a 2 days trip:
![itinerary3 page](demo/itinerary/itinerary3.png)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | [Next.js](https://nextjs.org/) (React, TypeScript) |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com/) (Python) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) with [pgvector](https://github.com/pgvector/pgvector) |
| **Containerization** | [Docker](https://www.docker.com/) & Docker Compose |
| **LLM** | [Ollama](https://ollama.com/) (llama3) — runs locally |
| **Embeddings** | [BAAI/bge-base-en-v1.5](https://huggingface.co/BAAI/bge-base-en-v1.5) |
| **Data Sources** | OpenStreetMap, Wikimedia, Wikipedia |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                       │
│    Dashboard · Itinerary View · Search · Auth Pages           │
└──────────────────────┬───────────────────────────────────────┘
                       │ REST API (JWT auth)
┌──────────────────────▼───────────────────────────────────────┐
│                       FastAPI Backend                         │
│  /auth  /search  /places  /itinerary  /user  /onboarding      │
│                                                               │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │ Embeddings   │  │ Intent Parser  │  │  RAG + Ollama    │  │
│  │ (bge-base)   │  │ (rule-based)   │  │  (llama3)        │  │
│  └──────┬───────┘  └───────┬────────┘  └────────┬─────────┘  │
└─────────┼──────────────────┼───────────────────┼─────────────┘
          │                  │                   │
┌─────────▼──────────────────▼───────────────────▼─────────────┐
│                  PostgreSQL + pgvector                         │
│           places · users · auth_tokens                         │
└──────────────────────────────────────────────────────────────┘
```

Data ingestion pipeline (run once to seed the database):
Output file saved as `new-places.json` in frontend/data/ folder
```
OSM / Wikimedia / Wikipedia
     │
   fetch-osm.ts          →  new-places.json
   embed_places.py       →  adds vector embeddings
   db.ts                 →  seeds PostgreSQL
```
```bash
cd frontend
npm run fetch:osm
npm run embed:places
npm run db
```
---

## Project Structure

```
SMARTTRIP
├── backend/                
│   └── app/     
|       ├── core/
|       |   ├── config_loader.py        # Loads environment-specific settings from .env or config files into the app
|       |   ├── config.py               # Defines global configuration constants and Pydantic settings model
|       |   └── database.py             # Sets up SQLAlchemy engine, session factory, and Base declarative model
|       ├── db/
|       |   ├── dashboard/
|       |   |   └── schemas.py          # Pydantic response models for dashboard and onboarding data
|       |   ├── itinerary/
|       |   |   └── schemas.py          # Pydantic request/response models for place search queries and itinerary request
|       |   └── user/
|       |       └── schemas.py          # Pydantic models for user profile data (read/create/update payloads)
|       ├── models/
|       |   ├── auth/
|       |   |   └── models.py           # SQLAlchemy model for auth tokens or refresh token storage
|       |   ├── place/
|       |   |   └── models.py           # SQLAlchemy model for place records
|       |   └── user/
|       |       └── models.py           # SQLAlchemy model for user accounts (id, email, preferences, timestamps)
|       ├── routers/
|       |   ├── auth.py                 # Endpoints for login, signup, token refresh, and logout
|       |   ├── itinerary.py            # Endpoints to create, retrieve, update, and delete trip itineraries
|       |   ├── onboarding.py           # Endpoints that handle new-user onboarding flow and preference collection
|       |   ├── places.py               # Endpoints to fetch place details, photos, and ratings from upstream APIs
|       |   ├── search.py               # Endpoints for semantic / keyword place search and autocomplete
|       |   └── user.py                 # Endpoints for reading and updating the authenticated user's profile
|       |
|       ├── services/
|       |   ├── auth_service.py         # Business logic for JWT creation, validation, and password hashing
|       |   ├── embeddings.py           # Generates and stores vector embeddings for places to enable semantic search
|       |   ├── intent.py               # Parses natural-language queries into structured search intents or filters
|       |   └── user_services.py        # Business logic for user creation, profile updates, and preference management
|       ├── utils/ 
|       |   └── auth_utils.py           # Helper functions: token decoding, current-user dependency, password hashing wrappers
|       └── main.py                     # FastAPI app factory — registers routers, CORS, middleware, and startup events         
|
├── frontend/              
|   ├── scripts/
|   |   ├── db.ts                       # Creates tables and seeds PostgreSQL
|   |   ├── embed_places.py             # Adds vector embeddings to places.json
|   |   └── fetch-osm.ts                # Fetches places from OSM, Wikimedia & Wikipedia
|   ├── data/
|   |   └── sample-places.json          # Sample json file for places
|   └── src/
|       ├── app/
|       |   ├── dashboard/
|       |   |   └── page.tsx            # Authenticated home screen showing saved itineraries and quick search
|       |   ├── itinerary/
|       |   |   └── page.tsx            # Full itinerary view with day-by-day plan, place cards, and edit controls
|       |   ├── login/
|       |   |   └── page.tsx            # Login form with email/password fields and OAuth entry points
|       |   ├── onboarding/
|       |   |   └── page.tsx            # Multi-step onboarding wizard for collecting travel preferences
|       |   └── signup/
|       |       └── page.tsx            # Account registration form with validation and redirect to onboarding
|       ├── components/
|       |    ├── ItineraryCard.tsx      # Card UI for a single itinerary — thumbnail, title, date range, action buttons
|       |    ├── Navbar.tsx             # Top navigation bar with logo, links, and user avatar/menu
|       |    ├── PlaceCard.tsx          # Displays a place with photo, name, rating, and "Add to itinerary" action
|       |    └── SearchBar.tsx          # Controlled input that debounces queries and emits results via callback
|       ├── lib/
|       |    ├── api.ts                 # Axios/fetch client factory with base URL, auth header injection, and error handling
|       |    ├── categoryMap.ts         # Maps raw place category keys to display labels and icon identifiers
|       |    ├── types.ts               # Centralised TypeScript type and interface definitions shared across the frontend
|       |    └── utils.ts               # General utility functions: date formatting, slug generation, class name helpers
|       └── middleware.ts               # Next.js middleware that protects routes — redirects unauthenticated users to /login
├── .gitignore                          # Files ignored by Git
└── README.md                           # This file
```

---

## Getting Started

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js](https://nodejs.org/) v18+
- [Python](https://www.python.org/) 3.10+
- A running PostgreSQL instance (or use the Docker Compose setup)
- [Ollama](https://ollama.com/) with `llama3` pulled locally

### 1. Clone the repository

```bash
git clone https://github.com/your-username/smart-trip.git
cd smart-trip
```

### 2. Set up the Python virtual environment

```bash
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (macOS / Linux)
source .venv/bin/activate
```

You should see `(.venv)` in your terminal prompt once activated.

### 3. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp backend/.env.example backend/.env
```
See the [Configuration](#configuration) section below for all required variables.

### 4. Generate the place dataset

Fetch places from OpenStreetMap, Wikimedia and Wikipedia:

```bash
cd frontend
npm install
npm run fetch:osm
```

This outputs `frontend/data/new-places.json`.

Add vector embeddings to the places:

```bash
npm run embed:places
```

Seed the database (update the connection string in `scripts/db.ts` first):

```bash
# In frontend/scripts/db.ts, replace:
# const connectionString = "<postgresql_url>";
# with your actual connection string, e.g.:
# const connectionString = "postgresql://postgres:postgres@localhost:5432/smarttrip";

npm run db
```

### 5. Start the backend

```bash
cd backend
docker compose up --build -d
```

The API will be available at `http://localhost:8000`.

### 6. Start the frontend

```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Configuration

Create a `.env` file in the `backend/` directory with the following variables:

| Variable | Description | Example |
|---|---|---|
| `OLLAMA_URL` | URL of the running Ollama instance | `http://host.docker.internal:11434/api/generate` |
| `OLLAMA_MODEL` | Ollama model name to use for generation | `llama3` |
| `MODEL_NAME` | Embedding model name | `BAAI/bge-base-en-v1.5` |
| `DATABASE_URL` | Full SQLAlchemy database URL | `postgresql+psycopg://user:pass@localhost:5432/smarttrip` |
| `POSTGRESQL_USERNAME` | PostgreSQL username | `postgres` |
| `POSTGRESQL_PASSWORD` | PostgreSQL password | `postgres` |
| `POSTGRESQL_PORT` | PostgreSQL port | `5432` |
| `POSTGRESQL_DATABASE` | Database name | `smarttrip` |
| `POSTGRESQL_SERVER` | Database host | `localhost` |
| `BACKEND_CORS_ORIGINS` | Comma-separated list of allowed origins | `http://localhost:3000` |
| `JWT_SECRET_KEY` | Secret key for signing JWT tokens | *(generate a strong random string)* |
| `AUTH_TOKEN_EXPIRY_MIN` | JWT token expiry in minutes | `60` |

---

## Security

- All protected routes require a valid JWT Bearer token in the `Authorization` header.
- Tokens are issued on login and expire after `AUTH_TOKEN_EXPIRY_MIN` minutes.
- The Next.js `middleware.ts` enforces client-side route protection, redirecting unauthenticated users to `/login`.
- Passwords are hashed before storage using bcrypt (via `auth_utils.py`).

---

## API Documentation

Once the backend is running, interactive API docs are available at:

- **Swagger UI:** `http://localhost:8000/docs`

---

## Acknowledgements

- [OpenStreetMap](https://www.openstreetmap.org/) — place geometry and metadata
- [Wikimedia Commons](https://commons.wikimedia.org/) — place images
- [Wikipedia](https://www.wikipedia.org/) — place descriptions
- [BAAI/bge-base-en-v1.5](https://huggingface.co/BAAI/bge-base-en-v1.5) — open-source embedding model
- [Ollama](https://ollama.com/) — local LLM inference

## Contact
For questions or support, contact xhwong24@gmail.com.
