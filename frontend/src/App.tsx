import { useState } from "react";
import type { CSSProperties } from "react";
import { searchSpotify } from "./api";
import type { Track } from "./api";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type MonthValue = { year: number; month: number };

const filterControlStyle: CSSProperties = {
  padding: "10px",
  background: "#222",
  color: "white",
  border: "1px solid #444",
  borderRadius: "5px",
  colorScheme: "dark",
};

const filterLabelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  fontSize: "12px",
  color: "#aaa",
};

/** Value for <input type="month">, e.g. "2026-10". */
function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Parse a "YYYY-MM" picker value. */
function parseMonthValue(value: string): MonthValue | null {
  const match = /^(\d{4})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

/**
 * Split a Spotify release date into year + month. Spotify can return
 * "2015" (year), "2015-06" (month) or "2015-06-21" (day) precision, so
 * the month is `null` when we only know the year.
 */
function releaseParts(
  releaseDate: string
): { year: number; month: number | null } | null {
  if (!releaseDate) {
    return null;
  }

  const [yearPart, monthPart] = releaseDate.split("-");
  const year = Number(yearPart);

  if (!Number.isInteger(year)) {
    return null;
  }

  const month = monthPart ? Number(monthPart) : null;

  if (
    month !== null &&
    (!Number.isInteger(month) || month < 1 || month > 12)
  ) {
    return null;
  }

  return { year, month };
}

/**
 * True when a release date falls inside the [from, to] month range.
 * Year-only dates stay inclusive, since we can't rule them out.
 */
function isInReleaseRange(
  releaseDate: string,
  from: MonthValue | null,
  to: MonthValue | null
): boolean {
  const release = releaseParts(releaseDate);

  if (!release) {
    return false;
  }

  const { year, month } = release;

  if (from) {
    if (year < from.year) {
      return false;
    }

    if (year === from.year && month !== null && month < from.month) {
      return false;
    }
  }

  if (to) {
    if (year > to.year) {
      return false;
    }

    if (year === to.year && month !== null && month > to.month) {
      return false;
    }
  }

  return true;
}

function formatMonthValue(value: string): string {
  const parsed = parseMonthValue(value);

  if (!parsed) {
    return value;
  }

  return `${MONTH_NAMES[parsed.month - 1]} ${parsed.year}`;
}

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
        released_from: releasedFrom || undefined,
        released_to: releasedTo || undefined,
      });

      let results = data.tracks.items;

      // --------------------------------------------------
      // Frontend month filtering
      // Spotify only filters by year, so narrow to the exact
      // release month here.
      // --------------------------------------------------

      const fromMonth = parseMonthValue(releasedFrom);
      const toMonth = parseMonthValue(releasedTo);

      if (fromMonth || toMonth) {
        results = results.filter((track) =>
          isInReleaseRange(
            track.album.release_date,
            fromMonth,
            toMonth
          )
        );
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
          style={filterControlStyle}
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
          style={{ ...filterControlStyle, width: "180px" }}
        />

        {/* Released from (month + year) */}

        <label style={filterLabelStyle}>
          Released from
          <input
            type="month"
            value={releasedFrom}
            max={releasedTo || currentMonthValue()}
            onChange={(e) => setReleasedFrom(e.target.value)}
            style={filterControlStyle}
          />
        </label>

        {/* Released to (month + year) */}

        <label style={filterLabelStyle}>
          Released to
          <input
            type="month"
            value={releasedTo}
            min={releasedFrom || undefined}
            max={currentMonthValue()}
            onChange={(e) => setReleasedTo(e.target.value)}
            style={filterControlStyle}
          />
        </label>

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
              {releasedFrom
                ? formatMonthValue(releasedFrom)
                : "Any"}{" "}
              →{" "}
              {releasedTo
                ? formatMonthValue(releasedTo)
                : "Any"}
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