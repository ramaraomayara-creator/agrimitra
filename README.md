# AgriMitra 🌱

Smart farming website for farmers — crop guides, live weather, disease detection help, mandi prices and farming tips.

## Structure

- Frontend (HTML/CSS/JS): `index.html`, `home.html`, `crop-selection.html`, `crop.html`, `crop-guide.html`, `crop-guide-details.html`, `crop-details.html`
- Backend (Node.js + Express): `backend/` — serves the site and live-data APIs

## Run locally

```bash
cd backend
npm install
npm start
```

Open `http://localhost:5000` — Login/OTP → Crop Selection → Crop Page → View Guide → Dashboard.

## Live data

- Weather: Open-Meteo (no key needed)
- Market prices: data.gov.in mandi dataset — put your free key in `backend/.env`:

```bash
DATA_GOV_API_KEY=your_key_here
```

Get a key at https://data.gov.in (My Account → API keys). See `backend/API.md` for all endpoints.
