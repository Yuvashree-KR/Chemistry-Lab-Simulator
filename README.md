# Chemistry Lab Escape — Netlify Ready

A kid-friendly 2-player cooperative chemistry escape game. Players share a lab code and complete three rounds together:

1. **Round 1 — Lights:** solve the blue-bottle code `246` (10 points + 5 first-finish bonus).
2. **Round 2 — Green Glow:** mix **Blue + Yellow** (20 points + 5 first-finish bonus).
3. **Round 3 — Purple Spark:** mix **Green + Red** (30 points + 5 first-finish bonus).

Both players must complete every round. Scores are stored server-side and the final winner is announced when both finish Round 3.

## Publishing

This folder is designed for Netlify. It contains a root `netlify.toml`, `package.json`, lockfile, static frontend, and `netlify/functions/game.ts`.

The frontend calls `/.netlify/functions/game` directly. The function uses Netlify Blobs with strong consistency and ETag-based conditional writes, so simultaneous player updates do not silently overwrite one another.

No GitHub repository, API key, environment variable, database setup, or continuously running backend is required.


## Important: deploy the project folder, not the ZIP file itself

After downloading this ZIP, extract it. In Netlify Drop, use the extracted **netlify-ready-game folder** (the folder containing `netlify.toml`, `package.json`, `public`, and `netlify/functions`) rather than dropping only the ZIP as a static file. Netlify's build system must see the functions directory so it can prepare and deploy `netlify/functions/game.ts`.

After deployment, open `/.netlify/functions/game` in the deployed site's domain. A healthy deployment returns JSON containing `"ok":true` and `"function":"game"`. The game page calls this same endpoint.
