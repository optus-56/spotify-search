import { useState } from "react";
import { searchSpotify } from "./api";
import type { Track } from "./api";

function App() {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [artist, setArtist] = useState("");

  const [releasedFrom, setReleasedFrom] = useState("");
  const [releasedTo, setReleasedTo] = useState("");

  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    // Don't search if absolutely nothing is selected
    if (
      !query.trim() &&
      !genre &&
      !artist &&
      !releasedFrom &&
      !releasedTo
    ) {
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const data = await searchSpotify({
        q: query.trim() || undefined,
        genre: genre || undefined,
        artist: artist.trim() || undefined,
        released_from: releasedFrom
          ? Number(releasedFrom)
          : undefined,
        released_to: releasedTo
          ? Number(releasedTo)
          : undefined,
      });

      let results = data.tracks.items;

      // --------------------------------------------------
      // Frontend year filtering
      // --------------------------------------------------

      if (releasedFrom || releasedTo) {
        results = results.filter((track) => {
          const releaseDate = track.album.release_date;

          if (!releaseDate) {
            return false;
          }

          const releaseYear = Number(
            releaseDate.substring(0, 4)
          );

          if (Number.isNaN(releaseYear)) {
            return false;
          }

          if (
            releasedFrom &&
            releaseYear < Number(releasedFrom)
          ) {
            return false;
          }

          if (
            releasedTo &&
            releaseYear > Number(releasedTo)
          ) {
            return false;
          }

          return true;
        });
      }

      setTracks(results);
    } catch (error) {
      console.error("Search error:", error);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setQuery("");
    setGenre("");
    setArtist("");
    setReleasedFrom("");
    setReleasedTo("");
    setTracks([]);
    setSearched(false);
  }

  return (
    <div
      style={{
        background: "#111",
        color: "white",
        minHeight: "100vh",
        padding: "40px 50px",
      }}
    >
      <h1>Spotify Search</h1>

      {/* --------------------------------------------- */}
      {/* Search input                                  */}
      {/* --------------------------------------------- */}

      <div style={{ marginBottom: "25px" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          placeholder="Search for a song..."
          style={{
            padding: "12px",
            width: "400px",
            background: "#222",
            color: "white",
            border: "1px solid #444",
            borderRadius: "6px",
          }}
        />

        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: "12px 20px",
            marginLeft: "10px",
            cursor: loading ? "default" : "pointer",
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* --------------------------------------------- */}
      {/* Filters                                       */}
      {/* --------------------------------------------- */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "15px",
          alignItems: "center",
          marginBottom: "25px",
          padding: "20px",
          background: "#1a1a1a",
          borderRadius: "8px",
          border: "1px solid #333",
        }}
      >
        {/* Genre */}

        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          style={{
            padding: "10px",
            background: "#222",
            color: "white",
            border: "1px solid #444",
            borderRadius: "5px",
          }}
        >
          <option value="">All Genres</option>
          <option value="pop">Pop</option>
          <option value="rock">Rock</option>
          <option value="hip-hop">Hip-Hop</option>
          <option value="rap">Rap</option>
          <option value="electronic">Electronic</option>
          <option value="jazz">Jazz</option>
          <option value="classical">Classical</option>
          <option value="country">Country</option>
          <option value="r&b">R&B</option>
          <option value="metal">Metal</option>
          <option value="indie">Indie</option>
          <option value="folk">Folk</option>
          <option value="blues">Blues</option>
          <option value="reggae">Reggae</option>
        </select>

        {/* Artist */}

        <input
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          placeholder="Artist"
          style={{
            padding: "10px",
            width: "180px",
            background: "#222",
            color: "white",
            border: "1px solid #444",
            borderRadius: "5px",
          }}
        />

        {/* Released From */}

        <select
          value={releasedFrom}
          onChange={(e) => {
            const value = e.target.value;
            setReleasedFrom(value);

            if (
              releasedTo &&
              value &&
              Number(value) > Number(releasedTo)
            ) {
              setReleasedTo("");
            }
          }}
          style={{
            padding: "10px",
            background: "#222",
            color: "white",
            border: "1px solid #444",
            borderRadius: "5px",
          }}
        >
          <option value="">Released From</option>

          {Array.from(
            { length: new Date().getFullYear() - 1900 + 1 },
            (_, i) => new Date().getFullYear() - i
          ).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        {/* Released To */}

        <select
          value={releasedTo}
          onChange={(e) => {
            const value = e.target.value;

            if (
              releasedFrom &&
              value &&
              Number(value) < Number(releasedFrom)
            ) {
              return;
            }

            setReleasedTo(value);
          }}
          style={{
            padding: "10px",
            background: "#222",
            color: "white",
            border: "1px solid #444",
            borderRadius: "5px",
          }}
        >
          <option value="">Released To</option>

          {Array.from(
            { length: new Date().getFullYear() - 1900 + 1 },
            (_, i) => new Date().getFullYear() - i
          ).map((year) => (
            <option
              key={year}
              value={year}
              disabled={
                releasedFrom
                  ? year < Number(releasedFrom)
                  : false
              }
            >
              {year}
            </option>
          ))}
        </select>

        {/* Clear */}

        <button
          onClick={clearFilters}
          style={{
            padding: "10px 15px",
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>

      {/* --------------------------------------------- */}
      {/* Active filters                                */}
      {/* --------------------------------------------- */}

      {(genre ||
        artist ||
        releasedFrom ||
        releasedTo) && (
        <div
          style={{
            marginBottom: "20px",
            color: "#aaa",
          }}
        >
          <strong>Filters:</strong>{" "}

          {genre && (
            <span style={{ marginRight: "12px" }}>
              Genre: {genre}
            </span>
          )}

          {artist && (
            <span style={{ marginRight: "12px" }}>
              Artist: {artist}
            </span>
          )}

          {(releasedFrom || releasedTo) && (
            <span>
              Released:{" "}
              {releasedFrom || "Any"} →{" "}
              {releasedTo || "Any"}
            </span>
          )}
        </div>
      )}

      {/* --------------------------------------------- */}
      {/* Results                                       */}
      {/* --------------------------------------------- */}

      <div style={{ marginTop: "30px" }}>
        {loading && <p>Searching Spotify...</p>}

        {!loading &&
          searched &&
          tracks.length === 0 && (
            <p style={{ color: "#aaa" }}>
              No results found.
            </p>
          )}

        {!loading &&
          tracks.map((track) => (
            <a
              key={track.id}
              href={`https://open.spotify.com/track/${track.id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  marginBottom: "20px",
                  padding: "15px",
                  background: "#1a1a1a",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                {/* Album image */}
                {track.album.images &&
                  track.album.images.length > 0 && (
                    <img
                      src={track.album.images[0].url}
                      alt={track.album.name}
                      width="100"
                      height="100"
                      style={{
                        objectFit: "cover",
                        borderRadius: "5px",
                      }}
                    />
                  )}

                {/* Track information */}
                <div>
                  <h3 style={{ marginTop: 0 }}>
                    {track.name}
                  </h3>

                  <p>
                    <strong>Artist:</strong>{" "}
                    {track.artists
                      .map((artist) => artist.name)
                      .join(", ")}
                  </p>

                  <p>
                    <strong>Album:</strong>{" "}
                    {track.album.name}
                  </p>

                  <p>
                    <strong>Released:</strong>{" "}
                    {track.album.release_date}
                  </p>

                  {track.explicit && (
                    <p>
                      <strong>Explicit:</strong> Yes
                    </p>
                  )}
                </div>
              </div>
            </a>
          ))}
      </div>
    </div>
  );
}

export default App;