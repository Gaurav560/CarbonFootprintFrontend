# Carbon Footprint Frontend (MVP)

Minimal React + Vite + Tailwind app with a single `App.jsx` that:
- Captures monthly inputs
- Calls POST /api/footprint/calculate
- Shows results with color-coded impact and recommendations
- Lists simple history via GET /api/footprint/history?userId=...

Dev server proxies /api to http://localhost:8080.

## Run

1. Install deps
2. Start dev server
3. Build for production

## Notes
- No external libs besides React, Vite, Tailwind
- Components kept inline for speed
- Styling uses Tailwind utility classes only