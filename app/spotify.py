import os
import time
import base64

import httpx
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

token = None
expires_at = 0


async def get_token():
    global token, expires_at

    if token and time.time() < expires_at:
        return token

    if not CLIENT_ID or not CLIENT_SECRET:
        raise RuntimeError(
            "SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is missing"
        )

    auth = base64.b64encode(
        f"{CLIENT_ID}:{CLIENT_SECRET}".encode()
    ).decode()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://accounts.spotify.com/api/token",
            headers={
                "Authorization": f"Basic {auth}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={
                "grant_type": "client_credentials",
            },
        )

    if response.status_code != 200:
        raise RuntimeError(
            f"Spotify authentication failed: {response.text}"
        )

    data = response.json()

    token = data["access_token"]

    expires_at = (
        time.time()
        + data.get("expires_in", 3600)
        - 60
    )

    return token

async def spotify_search(
    query: str,
    search_type: str = "track",
    limit: int = 50,
    offset: int = 0,
):
    global token, expires_at

    token = await get_token()

    # Spotify Search API currently allows max 10 per request
    requested_limit = max(1, int(limit))

    all_items = []
    current_offset = offset

    async with httpx.AsyncClient() as client:

        while len(all_items) < requested_limit:

            # Maximum Spotify allows per request
            batch_limit = min(10, requested_limit - len(all_items))

            params = {
                "q": query,
                "type": search_type,
                "limit": batch_limit,
                "offset": current_offset,
            }

            headers = {
                "Authorization": f"Bearer {token}",
            }

            response = await client.get(
                "https://api.spotify.com/v1/search",
                params=params,
                headers=headers,
            )

            # Token expired
            if response.status_code == 401:
                token = None
                expires_at = 0

                token = await get_token()

                headers["Authorization"] = (
                    f"Bearer {token}"
                )

                response = await client.get(
                    "https://api.spotify.com/v1/search",
                    params=params,
                    headers=headers,
                )

            if response.status_code != 200:
                raise RuntimeError(
                    f"Spotify search failed "
                    f"({response.status_code}): "
                    f"{response.text}"
                )

            data = response.json()

            tracks = data.get("tracks", {})
            items = tracks.get("items", [])

            all_items.extend(items)

            # No more results
            if not items:
                break

            # Spotify says there are no more results
            total = tracks.get("total", 0)

            current_offset += len(items)

            if current_offset >= total:
                break

    # Return the same structure Spotify normally returns
    return {
        "tracks": {
            "items": all_items,
            "total": len(all_items),
            "limit": requested_limit,
            "offset": offset,
        }
    }