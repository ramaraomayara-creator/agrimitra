# AgriMitra Backend — API Documentation

Base URL (local): `http://localhost:5000`

Every response uses one envelope:

```json
// success
{ "success": true, "data": {}, "source": "…", "lastUpdated": "…", "error": null }

// error
{ "success": false, "data": null, "source": null, "lastUpdated": null,
  "error": { "code": "…", "message": "Farmer-friendly message" } }
```

Freshness labels used by the frontend: `LIVE` (< 6 h old) · `RECENT` (older, timestamp shown) · `UNAVAILABLE` (no usable data). Cached data is always shown with its timestamp, never called "live".

---

## GET /api/health
Server liveness.
```bash
curl http://localhost:5000/api/health
```
```json
{ "success": true, "server": "AgriMitra", "status": "running", "timestamp": "…" }
```

## GET /api/providers/status
Dependency status (no secrets leaked).
```bash
curl http://localhost:5000/api/providers/status
```
```json
{ "success": true,
  "data": { "weather": "available",
    "market": { "provider": "data.gov.in", "configured": true, "status": "available" },
    "database": "not_configured", "cache": "available" }, … }
```

## GET /api/crops?search={query}
Crop search (local library, long cache).
```bash
curl "http://localhost:5000/api/crops?search=rice"
curl "http://localhost:5000/api/crops"
```
```json
{ "success": true,
  "data": [{ "id": "rice", "name": "Rice", "sub": "…", "cat": "Cereals", "img": "…" }],
  "source": "AgriMitra crop library", … }
```

## GET /api/crops/:crop
Full crop detail (overview, seeds, growth timeline).
```bash
curl http://localhost:5000/api/crops/rice
```
Returns `data` = full crop object (`climate`, `soil`, `season`, `duration`, `seed{}`, `timeline[]`).

## GET /api/weather?lat=&lon=
Live weather (Open-Meteo, keyless). Also powers the dashboard Weather tab.
```bash
curl "http://localhost:5000/api/weather?lat=17.68&lon=83.22"
```
```json
{ "success": true,
  "data": {
    "location": { "name": "17.68, 83.22", "lat": 17.68, "lon": 83.22, "timezone": "Asia/Kolkata" },
    "current": { "tempC": 31.2, "humidity": 62, "rainfallMm": 0.0,
                 "precipProb": 10, "windKmh": 14.1, "condition": "Partly cloudy",
                 "sunrise": "…", "sunset": "…" },
    "forecast": [{ "date": "…", "maxC": 33, "minC": 24, "condition": "…", "precipProb": 20 }]
  },
  "source": "Open-Meteo", … }
```

## GET /api/weather/location?city=
Geocode a city → then live weather.
```bash
curl "http://localhost:5000/api/weather/location?city=Guntur"
```

## GET /api/market-prices?crop=&state=&district=&market=
Live mandi prices from the Government of India dataset
"Current Daily Price of Various Commodities from Various Markets (Mandi)"
(`api.data.gov.in`, resource `9ef84268-d588-465a-a308-a864a43d0070`).
Needs `DATA_GOV_API_KEY` (free — register at https://data.gov.in → My Account → API keys).
For quick testing, data.gov.in publishes a public sample key (max ~10 records,
see the dataset's API page on data.gov.in); for real use, paste your own key.
```bash
curl "http://localhost:5000/api/market-prices?crop=Rice&state=Andhra%20Pradesh"
curl "http://localhost:5000/api/market-prices?crop=Cotton&state=Andhra%20Pradesh"
curl "http://localhost:5000/api/market-prices?crop=Cotton&state=Andhra%20Pradesh&refresh=1"
curl "http://localhost:5000/api/market-prices?crop=InvalidCrop"
# Example commodity: Guar Seed (Cluster Beans Seed), e.g. Rajasthan mandis
curl "http://localhost:5000/api/market-prices?crop=guar&state=Rajasthan&district=Bikaner"
curl "http://localhost:5000/api/market-prices?crop=guar&state=Haryana&district=Hisar"
```
```json
{ "success": true, "source": "Government of India - Data.gov.in",
  "lastUpdated": "…", "crop": "Rice",
  "markets": [{ "market": "Vijayawada", "district": "Krishna",
    "state": "Andhra Pradesh", "commodity": "Paddy", "variety": "…",
    "minPrice": 2100, "maxPrice": 2450, "modalPrice": 2300,
    "unit": "Quintal", "arrivalDate": "…" }] }
```
No records → `200 { "success": false, "source": "…",
"message": "No market-price data available for this crop/location." }`
(never fake numbers). Key problems → auth message; rate limits → busy message;
timeouts → temporarily-unavailable message. State filtering uses the dataset's
`filters[state.keyword]` field; if a commodity spelling returns nothing, the
backend retries unfiltered and matches crop aliases locally.

## GET /api/markets?crop=&state=&district=
Market directory (names + official contacts where listed — prices intentionally `null`).
`contact` is `{phone, email}` or `null` (frontend shows "—"); fill verified
APMC values in `services/locationService.js` — never invent numbers.
```bash
curl "http://localhost:5000/api/markets?crop=rice&state=Andhra%20Pradesh"
```

## GET /api/locations / ?state= / ?state=&district=
Dropdown data: states → districts → mandals (reference) + directory markets.
Price data itself is market-level; mandal is a reference layer.
```bash
curl http://localhost:5000/api/locations
curl "http://localhost:5000/api/locations?state=Maharashtra"
curl "http://localhost:5000/api/locations?state=Andhra%20Pradesh&district=Krishna"
```

## POST /api/auth/request-otp · POST /api/auth/verify-otp
Development stubs reserving the future SMS-gateway integration.
The shipped frontend keeps its existing demo OTP flow; these are unused by it.
```bash
curl -X POST http://localhost:5000/api/auth/request-otp \
  -H "Content-Type: application/json" -d '{"phone":"+91 98765 43210"}'
```

---

## Setup & keys

| Provider | Key needed? | Where to get / set |
|---|---|---|
| Open-Meteo weather | No (non-commercial dev) | Works out of the box |
| data.gov.in mandi prices | Yes, free | Register at https://data.gov.in → API keys → set `DATA_GOV_API_KEY` in `backend/.env` |
| Backup market URL | Only if you have one | Set `MARKET_API_URL` (+`MARKET_API_KEY`) |

```bash
cd backend
npm install
npm start      # http://localhost:5000 (also serves the frontend)
npm run dev    # nodemon live-reload
```

Security: helmet, CORS (`FRONTEND_ORIGIN`), 300 req/15 min rate limit on `/api`,
strict validation of crop/state/district/market/lat/lon/city, 12–15 s upstream
timeouts, no provider URLs or keys ever sent to the browser.
