# Dadaab Climate Risk Dashboard

A production-grade GIS web application for climate hazard monitoring and disaster risk reduction in the Dadaab refugee complex, Garissa County, Kenya.

Built as a portfolio demonstration of GIS web development capabilities using real-time open geospatial data.

## Live Data Sources

| Layer | API | Update Frequency |
|---|---|---|
| Fire hotspots | NASA FIRMS (VIIRS SNPP) | Daily |
| Weather & drought | Open-Meteo | Hourly |
| Refugee population | UNHCR Data API | Annual |
| Health & water infrastructure | OpenStreetMap Overpass | On load (cached) |
| Seismic activity | USGS Earthquake Catalog | Real-time |
| Drought zones | FEWS NET IPC (static) | Seasonal |
| Flood areas | SRTM DEM-derived (static) | Static |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | SvelteKit + Svelte 5 runes |
| Map engine | MapLibre GL JS |
| UI / Styling | Tailwind CSS v4 |
| Language | TypeScript (strict) |
| Package manager | pnpm |
| Deployment | Vercel |

## Getting Started

```bash
pnpm install
cp .env.example .env
# Optionally add your NASA FIRMS MAP key to .env
pnpm dev
```

## API Keys

### NASA FIRMS (Optional)
Register for a free MAP key at https://firms.modaps.eosdis.nasa.gov/api/area/

Without a key, fire hotspot data falls back to representative demo points and a banner is shown. All other APIs are keyless and work out of the box.

## Deployment

```bash
vercel --prod
```

Set `PUBLIC_FIRMS_MAP_KEY` in Vercel environment variables for live fire data.

## Data Disclaimer

Data displayed in this dashboard is sourced from public APIs and is provided for informational and portfolio demonstration purposes only. Population figures and hazard classifications should not be used for emergency response or humanitarian operations without verification from official UNHCR, FEWS NET, and relevant agency sources. The Dadaab refugee complex is a dynamic environment; conditions may differ from what is shown.
