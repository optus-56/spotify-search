const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  uri: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  release_date: string;
  release_date_precision: string;
  images: SpotifyImage[];
}

export interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
  duration_ms: number;
  explicit: boolean;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  preview_url: string | null;
}

// App.tsx expects Track
export type Track = SpotifyTrack;

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface SearchParams {
  q?: string;
  genre?: string;
  artist?: string;
  released_from?: number;
  released_to?: number;
}

export async function searchSpotify(
  params: SearchParams
): Promise<SpotifySearchResponse> {
  const searchParams = new URLSearchParams();

  if (params.q) {
    searchParams.set("q", params.q);
  }

  if (params.genre) {
    searchParams.set("genre", params.genre);
  }

  if (params.artist) {
    searchParams.set("artist", params.artist);
  }

  if (params.released_from !== undefined) {
    searchParams.set(
      "released_from",
      params.released_from.toString()
    );
  }

  if (params.released_to !== undefined) {
    searchParams.set(
      "released_to",
      params.released_to.toString()
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/search?${searchParams.toString()}`
  );

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  return response.json();
}