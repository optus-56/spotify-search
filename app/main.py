from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://spotify-search-y345.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.spotify import spotify_search


@app.get("/search")
async def search(
    q: str | None = None,
    genre: str | None = None,
    artist: str | None = None,
    year: str | None = None,
    released_from: int | None = None,
    released_to: int | None = None,
):
    parts = []

    if q and q.strip():
        parts.append(q.strip())

    if genre:
        parts.append(f"genre:{genre}")

    if artist:
        parts.append(f"artist:{artist}")

    if year:
        parts.append(f"year:{year}")

    if released_from is not None and released_to is not None:
        parts.append(f"year:{released_from}-{released_to}")

    elif released_from is not None:
        parts.append(f"year:{released_from}-")

    elif released_to is not None:
        parts.append(f"year:-{released_to}")

    if not parts:
        return {
            "tracks": {
                "items": [],
                "total": 0,
                "limit": 0,
                "offset": 0,
            }
        }

    query = " ".join(parts)

    return await spotify_search(
        query=query,
        search_type="track",
        limit=50,
    )