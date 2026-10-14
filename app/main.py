import re

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
        "https://optus-56.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.spotify import spotify_search

_YEAR_RE = re.compile(r"^\s*(\d{4})")


def _parse_year(value: str | None) -> int | None:
    """Accept "2015" or "2015-06" and return the year (or None)."""
    if value is None:
        return None

    match = _YEAR_RE.match(str(value))

    if not match:
        return None

    year = int(match.group(1))

    if year < 1900 or year > 2100:
        return None

    return year


@app.get("/search")
async def search(
    q: str | None = None,
    genre: str | None = None,
    artist: str | None = None,
    year: str | None = None,
    released_from: str | None = None,
    released_to: str | None = None,
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

    # Spotify's search API only understands year granularity, so we narrow the
    # query to the span of years and filter down to exact months in the UI.
    from_year = _parse_year(released_from)
    to_year = _parse_year(released_to)

    if from_year is not None and to_year is not None:
        if from_year > to_year:
            from_year, to_year = to_year, from_year

        if from_year == to_year:
            parts.append(f"year:{from_year}")
        else:
            parts.append(f"year:{from_year}-{to_year}")

    elif from_year is not None:
        parts.append(f"year:{from_year}-")

    elif to_year is not None:
        parts.append(f"year:-{to_year}")

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