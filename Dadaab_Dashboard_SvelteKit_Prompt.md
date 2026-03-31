# Dadaab Climate Risk Dashboard — Full Build Prompt
## SvelteKit + MapLibre GL JS + shadcn-svelte + Tailwind CSS v4 + Vercel

---

## MISSION STATEMENT

Build a production-ready, portfolio-quality **Dadaab Climate Risk Dashboard** — a professional GIS web application that fetches **live data from free public APIs** to display climate hazard layers, refugee camp exposure, and composite risk mapping for the Dadaab refugee complex in Garissa County, Kenya.

This is an audition piece for a GIS Technician role focused on **Disaster Risk Reduction (DRR) and climate change risk mapping**. The app must look and work like something a senior GIS developer would deploy for a humanitarian organisation. It must be visually exceptional, technically solid, and demonstrate real geospatial competence — not just a pretty map with fake data.

---

## TECH STACK (non-negotiable)

| Layer | Technology |
|---|---|
| Framework | SvelteKit (latest) with Svelte 5 runes |
| Map engine | MapLibre GL JS (latest) |
| UI components | shadcn-svelte (https://www.shadcn-svelte.com/) |
| Styling | Tailwind CSS v4 |
| Language | TypeScript (strict mode) |
| Package manager | pnpm |
| Deployment | Vercel (@sveltejs/adapter-vercel) |
| HTTP client | Native fetch (no axios) |
| Icons | lucide-svelte |

---

## LIVE API DATA SOURCES

This is the most important section. All map layers must fetch **real data from these free APIs**. No hardcoded coordinates except for static reference data like camp centroids.

### 1. NASA FIRMS — Active Fire / Thermal Anomalies
**What:** Real satellite fire detections (MODIS + VIIRS) updated every 24h
**Free API:** `https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/VIIRS_SNPP_NRT/{AREA}/{DAYS}`
- Get a free MAP key at: https://firms.modaps.eosdis.nasa.gov/api/area/
- Area for Dadaab: `39.5,0.8,41.2,2.5` (west,south,east,north)
- Days: `7` (last 7 days)
- Returns CSV: `latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight`
- Parse CSV client-side with a tiny parser (no library needed)
- Store API key in `.env` as `PUBLIC_FIRMS_MAP_KEY`

**Fallback:** If key not set or API fails, use 15 hardcoded representative hotspots around Garissa County and show a banner: "Demo mode — configure FIRMS API key for live fire data"

### 2. Open-Meteo — Current Weather & Drought Indicators
**What:** Free weather API, no key required
**Endpoints:**

```
// Current weather at Dadaab centroid
https://api.open-meteo.com/v1/forecast?latitude=1.65&longitude=40.35
  &current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code
  &daily=precipitation_sum,et0_fao_evapotranspiration,precipitation_probability_max
  &forecast_days=7
  &timezone=Africa%2FNairobi

// Historical rainfall anomaly (last 30 days vs climatology)
https://archive-api.open-meteo.com/v1/archive?latitude=1.65&longitude=40.35
  &start_date={30_DAYS_AGO}&end_date={TODAY}
  &daily=precipitation_sum,et0_fao_evapotranspiration
  &timezone=Africa%2FNairobi
```

**Use for:**
- Current conditions panel (temp, humidity, wind, weather code)
- 7-day precipitation forecast sparkline chart
- Drought stress index: compute `cumulative_ET0 - cumulative_precipitation` over 30 days. If > 150mm deficit → SEVERE DROUGHT; > 80mm → MODERATE; < 80mm → NORMAL
- Display as a drought severity badge in the hazard summary

### 3. UNHCR Data API — Refugee Population Statistics
**What:** Official UNHCR population figures, free, no key required
**Endpoint:**
```
https://api.unhcr.org/population/v1/population/?limit=20&dataset=population
  &displayType=totals&location=KEN&year=2024&type=REF
```
**Also fetch camp-level data:**
```
https://api.unhcr.org/population/v1/population/?limit=100&dataset=population
  &displayType=totals&location=KEN&yearFrom=2019&yearTo=2024&type=REF
```
- Extract total refugees in Kenya for the stats panel
- Use for population trend sparkline (2019–2024)
- Falls back to static figure (700,000+) if API unavailable

### 4. OpenStreetMap Overpass API — Infrastructure & Settlement Data
**What:** Real OSM features — roads, water points, health facilities
**Endpoint:** `https://overpass-api.de/api/interpreter`
**Queries (POST requests with application/x-www-form-urlencoded body):**

```
// Health facilities near Dadaab (50km radius)
[out:json][timeout:25];
(
  node["amenity"~"hospital|clinic|health_centre|doctors"](0.8,39.5,2.5,41.2);
  way["amenity"~"hospital|clinic|health_centre|doctors"](0.8,39.5,2.5,41.2);
);
out body; >; out skel qt;

// Water points
[out:json][timeout:25];
(
  node["amenity"~"water_point|drinking_water|well"](0.8,39.5,2.5,41.2);
  node["man_made"~"water_well|water_works"](0.8,39.5,2.5,41.2);
);
out body; >; out skel qt;

// Main roads (for context layer)
[out:json][timeout:30];
way["highway"~"primary|secondary|tertiary"](0.8,39.5,2.5,41.2);
out body; >; out skel qt;
```

Cache Overpass responses in `sessionStorage` — these don't need to refresh every visit. Show a loading state while fetching.

### 5. USGS Earthquake Hazard — Seismic Background
**What:** Recent earthquakes near the region (East Africa Rift proximity)
**Free endpoint, no key:**
```
https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson
  &starttime={30_DAYS_AGO}&endtime={TODAY}
  &minlatitude=0.0&maxlatitude=3.0
  &minlongitude=39.0&maxlongitude=42.0
  &minmagnitude=2.0
  &orderby=time
```
- Show as small circles on map, sized by magnitude
- Display count and max magnitude in stats panel
- Usually few or none — that's fine, shows the data is real

### 6. Static Reference Data (hardcoded, these don't change)

```typescript
// src/lib/data/camps.ts
export const DADAAB_CAMPS = [
  {
    id: 'dagahaley',
    name: 'Dagahaley',
    lat: 1.7658,
    lng: 40.3289,
    established: 1991,
    area_km2: 10.9,
    description: 'Northernmost camp, established during 1991 Somalia crisis'
  },
  {
    id: 'hagadera',
    name: 'Hagadera',
    lat: 1.6012,
    lng: 40.3738,
    established: 1991,
    area_km2: 13.7,
    description: 'Largest camp by area, south of complex centre'
  },
  {
    id: 'ifo',
    name: 'Ifo',
    lat: 1.7011,
    lng: 40.3562,
    established: 1991,
    area_km2: 9.8,
    description: 'Central camp, original Dadaab settlement'
  },
  {
    id: 'ifo2',
    name: 'Ifo 2',
    lat: 1.6845,
    lng: 40.3410,
    established: 2011,
    area_km2: 7.2,
    description: 'Expansion camp opened during 2011 Horn of Africa drought'
  },
  {
    id: 'kambioos',
    name: 'Kambioos',
    lat: 1.7220,
    lng: 40.2950,
    established: 2011,
    area_km2: 5.1,
    description: 'Westernmost camp, now partially decommissioned'
  }
] as const

// FEWS NET IPC-style drought zones (static, based on published classifications)
export const DROUGHT_ZONES = [
  {
    id: 'ipc-phase4',
    label: 'IPC Phase 4 — Emergency',
    description: 'Households have large food consumption gaps with high acute malnutrition',
    color: '#cc3300',
    coordinates: [[39.8,1.0],[41.0,1.0],[41.0,2.3],[39.8,2.3],[39.8,1.0]]
  },
  {
    id: 'ipc-phase5',
    label: 'IPC Phase 5 — Famine Risk',
    description: 'Households have extreme food consumption gaps or extreme loss of livelihoods',
    color: '#8b0000',
    coordinates: [[40.0,1.2],[40.7,1.2],[40.7,1.8],[40.0,1.8],[40.0,1.2]]
  }
]

// Flood-prone areas derived from SRTM DEM analysis (Daua/Lak Dera drainage system)
export const FLOOD_ZONES = [
  {
    id: 'lak-dera-main',
    label: 'Lak Dera Seasonal Channel',
    coordinates: [[40.20,1.55],[40.28,1.60],[40.32,1.65],[40.38,1.68],[40.45,1.70],[40.50,1.65],[40.45,1.58],[40.38,1.52],[40.30,1.50],[40.22,1.52],[40.20,1.55]]
  },
  {
    id: 'northern-wadi',
    label: 'Northern Seasonal Wadi',
    coordinates: [[40.10,1.80],[40.18,1.85],[40.28,1.88],[40.35,1.85],[40.30,1.78],[40.20,1.75],[40.12,1.78],[40.10,1.80]]
  },
  {
    id: 'southern-channel',
    label: 'Southern Drainage Channel',
    coordinates: [[40.55,1.30],[40.62,1.35],[40.70,1.38],[40.72,1.32],[40.65,1.25],[40.58,1.22],[40.55,1.28],[40.55,1.30]]
  }
]
```

---

## PROJECT STRUCTURE

```
dadaab-risk-dashboard/
├── .env                          # API keys (gitignored)
├── .env.example                  # Template with variable names (committed)
├── package.json
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.ts
├── src/
│   ├── app.html
│   ├── app.css                   # Tailwind + shadcn CSS variables + custom tokens
│   ├── lib/
│   │   ├── components/
│   │   │   ├── map/
│   │   │   │   ├── MapContainer.svelte      # MapLibre GL wrapper, layer management
│   │   │   │   ├── LayerControls.svelte     # Toggle panel using shadcn Switch
│   │   │   │   ├── RiskLegend.svelte        # Color scale legend
│   │   │   │   ├── CampMarker.svelte        # Custom camp icon component
│   │   │   │   └── MapAttribution.svelte    # Data source credits on map
│   │   │   ├── panels/
│   │   │   │   ├── StatsBar.svelte          # Top KPI strip (mobile: horizontal scroll)
│   │   │   │   ├── WeatherPanel.svelte      # Open-Meteo current conditions
│   │   │   │   ├── DroughtIndex.svelte      # ET0 vs rainfall deficit gauge
│   │   │   │   ├── HazardSummary.svelte     # Risk chip table
│   │   │   │   ├── PopulationPanel.svelte   # UNHCR stats + trend sparkline
│   │   │   │   └── DataSources.svelte       # Attribution + API status indicators
│   │   │   ├── charts/
│   │   │   │   ├── RainfallSparkline.svelte # 7-day forecast bars (pure SVG)
│   │   │   │   └── PopTrend.svelte          # Population sparkline (pure SVG)
│   │   │   └── layout/
│   │   │       ├── Header.svelte            # Top navigation bar
│   │   │       ├── Sidebar.svelte           # Desktop panel (≥lg)
│   │   │       ├── MobileSheet.svelte       # Bottom sheet via shadcn Sheet
│   │   │       ├── ThemeToggle.svelte       # Dark/light switch
│   │   │       └── LoadingOverlay.svelte    # Initial data fetch skeleton
│   │   ├── api/
│   │   │   ├── firms.ts          # FIRMS CSV fetcher + parser
│   │   │   ├── openmeteo.ts      # Open-Meteo forecast + archive fetcher
│   │   │   ├── unhcr.ts          # UNHCR population API
│   │   │   ├── overpass.ts       # OSM Overpass queries + caching
│   │   │   └── usgs.ts           # USGS earthquake GeoJSON
│   │   ├── stores/
│   │   │   ├── mapStore.svelte.ts      # MapLibre instance (Svelte 5 $state)
│   │   │   ├── layerStore.svelte.ts    # Layer visibility state
│   │   │   ├── dataStore.svelte.ts     # All fetched API data
│   │   │   └── themeStore.svelte.ts    # Dark/light preference
│   │   ├── data/
│   │   │   ├── camps.ts          # Camp centroids (static)
│   │   │   ├── droughtZones.ts   # IPC drought polygons (static)
│   │   │   └── floodZones.ts     # Flood-prone areas (static)
│   │   ├── utils/
│   │   │   ├── riskColors.ts     # Score → color mapping
│   │   │   ├── csvParser.ts      # Minimal CSV parser for FIRMS data
│   │   │   ├── droughtCalc.ts    # ET0 deficit calculation
│   │   │   ├── dateUtils.ts      # Date formatting helpers
│   │   │   └── geojson.ts        # OSM → GeoJSON converters
│   │   └── types/
│   │       └── index.ts          # All TypeScript interfaces
│   └── routes/
│       ├── +layout.svelte        # Root layout (theme class on html)
│       ├── +layout.ts            # Load theme from localStorage
│       └── +page.svelte          # Main dashboard
```

---

## API MODULE SPECIFICATIONS

### `src/lib/api/firms.ts`

```typescript
import { PUBLIC_FIRMS_MAP_KEY } from '$env/static/public'

export interface FIRMSHotspot {
  latitude: number
  longitude: number
  brightness: number
  confidence: 'high' | 'nominal' | 'low'
  acq_date: string
  acq_time: string
  satellite: string
  frp: number  // fire radiative power in MW
  daynight: 'D' | 'N'
}

// Bounding box: west,south,east,north
const DADAAB_BBOX = '39.5,0.8,41.2,2.5'

export async function fetchFIRMSHotspots(days = 7): Promise<FIRMSHotspot[]> {
  if (!PUBLIC_FIRMS_MAP_KEY || PUBLIC_FIRMS_MAP_KEY === 'demo') {
    return FALLBACK_HOTSPOTS  // 15 hardcoded points
  }
  
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${PUBLIC_FIRMS_MAP_KEY}/VIIRS_SNPP_NRT/${DADAAB_BBOX}/${days}`
  
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`FIRMS API error: ${response.status}`)
    const csv = await response.text()
    return parseCSV(csv)
  } catch (err) {
    console.warn('FIRMS API unavailable, using fallback data:', err)
    return FALLBACK_HOTSPOTS
  }
}

function parseCSV(csv: string): FIRMSHotspot[] {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).map(line => {
    const values = line.split(',')
    const row = Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim()]))
    
    return {
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      brightness: parseFloat(row.bright_ti4 || row.brightness),
      confidence: (row.confidence?.toLowerCase() as FIRMSHotspot['confidence']) || 'nominal',
      acq_date: row.acq_date,
      acq_time: row.acq_time,
      satellite: row.satellite,
      frp: parseFloat(row.frp || '0'),
      daynight: (row.daynight as 'D' | 'N') || 'D'
    }
  }).filter(h => !isNaN(h.latitude) && !isNaN(h.longitude))
}

// Fallback data for demo mode
const FALLBACK_HOTSPOTS: FIRMSHotspot[] = [
  { latitude: 1.85, longitude: 39.95, brightness: 310, confidence: 'high', acq_date: '2026-03-28', acq_time: '0730', satellite: 'N', frp: 8.2, daynight: 'D' },
  { latitude: 1.92, longitude: 40.12, brightness: 325, confidence: 'nominal', acq_date: '2026-03-28', acq_time: '0730', satellite: 'N', frp: 12.1, daynight: 'D' },
  { latitude: 2.05, longitude: 40.33, brightness: 298, confidence: 'low', acq_date: '2026-03-29', acq_time: '1015', satellite: 'N', frp: 5.4, daynight: 'D' },
  { latitude: 1.78, longitude: 40.55, brightness: 340, confidence: 'high', acq_date: '2026-03-29', acq_time: '0730', satellite: 'N', frp: 18.7, daynight: 'D' },
  { latitude: 1.65, longitude: 40.68, brightness: 305, confidence: 'nominal', acq_date: '2026-03-30', acq_time: '0730', satellite: 'N', frp: 7.3, daynight: 'D' },
  { latitude: 1.45, longitude: 40.72, brightness: 315, confidence: 'high', acq_date: '2026-03-30', acq_time: '0730', satellite: 'N', frp: 9.8, daynight: 'N' },
  { latitude: 1.30, longitude: 40.50, brightness: 288, confidence: 'low', acq_date: '2026-03-27', acq_time: '1215', satellite: 'N', frp: 4.1, daynight: 'D' },
  { latitude: 1.20, longitude: 40.35, brightness: 330, confidence: 'high', acq_date: '2026-03-27', acq_time: '0730', satellite: 'N', frp: 14.5, daynight: 'D' },
  { latitude: 1.38, longitude: 40.18, brightness: 302, confidence: 'nominal', acq_date: '2026-03-26', acq_time: '0730', satellite: 'N', frp: 6.9, daynight: 'D' },
  { latitude: 1.55, longitude: 39.88, brightness: 318, confidence: 'high', acq_date: '2026-03-26', acq_time: '0730', satellite: 'N', frp: 11.2, daynight: 'D' },
  { latitude: 2.10, longitude: 39.90, brightness: 295, confidence: 'low', acq_date: '2026-03-25', acq_time: '1015', satellite: 'N', frp: 3.8, daynight: 'D' },
  { latitude: 2.18, longitude: 40.22, brightness: 345, confidence: 'high', acq_date: '2026-03-25', acq_time: '0730', satellite: 'N', frp: 21.3, daynight: 'D' },
  { latitude: 1.95, longitude: 40.78, brightness: 308, confidence: 'nominal', acq_date: '2026-03-24', acq_time: '0730', satellite: 'N', frp: 8.7, daynight: 'N' },
  { latitude: 1.10, longitude: 40.62, brightness: 322, confidence: 'high', acq_date: '2026-03-24', acq_time: '0730', satellite: 'N', frp: 13.4, daynight: 'D' },
  { latitude: 1.72, longitude: 40.82, brightness: 299, confidence: 'low', acq_date: '2026-03-23', acq_time: '0730', satellite: 'N', frp: 5.1, daynight: 'D' },
]
```

### `src/lib/api/openmeteo.ts`

```typescript
export interface WeatherCurrent {
  temperature_2m: number
  relative_humidity_2m: number
  precipitation: number
  wind_speed_10m: number
  weather_code: number
  time: string
}

export interface WeatherDaily {
  time: string[]
  precipitation_sum: number[]
  et0_fao_evapotranspiration: number[]
  precipitation_probability_max: number[]
}

export interface WeatherData {
  current: WeatherCurrent
  daily: WeatherDaily
}

export interface DroughtAssessment {
  deficit_mm: number  // cumulative ET0 - precipitation over 30 days
  severity: 'normal' | 'moderate' | 'severe' | 'extreme'
  label: string
  color: string
}

const BASE = 'https://api.open-meteo.com/v1/forecast'
const ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive'
const LAT = 1.65
const LNG = 40.35

export async function fetchWeather(): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(LAT),
    longitude: String(LNG),
    current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code',
    daily: 'precipitation_sum,et0_fao_evapotranspiration,precipitation_probability_max',
    forecast_days: '7',
    timezone: 'Africa/Nairobi'
  })
  
  const response = await fetch(`${BASE}?${params}`)
  if (!response.ok) throw new Error('Weather fetch failed')
  return response.json()
}

export async function fetchDroughtData(): Promise<DroughtAssessment> {
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)
  
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  
  const params = new URLSearchParams({
    latitude: String(LAT),
    longitude: String(LNG),
    start_date: fmt(thirtyDaysAgo),
    end_date: fmt(today),
    daily: 'precipitation_sum,et0_fao_evapotranspiration',
    timezone: 'Africa/Nairobi'
  })
  
  const response = await fetch(`${ARCHIVE}?${params}`)
  if (!response.ok) throw new Error('Archive weather fetch failed')
  const data = await response.json()
  
  const totalPrecip = (data.daily.precipitation_sum as number[]).reduce((a, b) => a + (b || 0), 0)
  const totalET0 = (data.daily.et0_fao_evapotranspiration as number[]).reduce((a, b) => a + (b || 0), 0)
  const deficit = Math.max(0, totalET0 - totalPrecip)
  
  if (deficit > 200) return { deficit_mm: deficit, severity: 'extreme', label: 'Extreme Drought', color: '#8b0000' }
  if (deficit > 150) return { deficit_mm: deficit, severity: 'severe', label: 'Severe Drought', color: '#cc3300' }
  if (deficit > 80) return { deficit_mm: deficit, severity: 'moderate', label: 'Moderate Drought', color: '#ff8800' }
  return { deficit_mm: deficit, severity: 'normal', label: 'Near Normal', color: '#22c55e' }
}

// Map WMO weather code to emoji + description
export function weatherCodeToLabel(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: '☀️', label: 'Clear sky' }
  if (code <= 3) return { emoji: '⛅', label: 'Partly cloudy' }
  if (code <= 49) return { emoji: '🌫️', label: 'Fog' }
  if (code <= 69) return { emoji: '🌧️', label: 'Rain' }
  if (code <= 79) return { emoji: '🌨️', label: 'Snow/Sleet' }
  if (code <= 99) return { emoji: '⛈️', label: 'Thunderstorm' }
  return { emoji: '🌡️', label: 'Unknown' }
}
```

### `src/lib/api/overpass.ts`

```typescript
export interface OSMFeature {
  type: 'node' | 'way'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags: Record<string, string>
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const CACHE_KEY_PREFIX = 'dadaab_overpass_'

async function overpassQuery(query: string, cacheKey: string): Promise<OSMFeature[]> {
  // Check sessionStorage cache first
  const cached = sessionStorage.getItem(`${CACHE_KEY_PREFIX}${cacheKey}`)
  if (cached) return JSON.parse(cached)
  
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`
  })
  
  if (!response.ok) throw new Error(`Overpass error: ${response.status}`)
  const data = await response.json()
  const elements = data.elements as OSMFeature[]
  
  sessionStorage.setItem(`${CACHE_KEY_PREFIX}${cacheKey}`, JSON.stringify(elements))
  return elements
}

export async function fetchHealthFacilities(): Promise<OSMFeature[]> {
  return overpassQuery(`
    [out:json][timeout:25];
    (
      node["amenity"~"hospital|clinic|health_centre|doctors"](0.8,39.5,2.5,41.2);
      way["amenity"~"hospital|clinic|health_centre|doctors"](0.8,39.5,2.5,41.2);
    );
    out body; >; out skel qt;
  `, 'health')
}

export async function fetchWaterPoints(): Promise<OSMFeature[]> {
  return overpassQuery(`
    [out:json][timeout:25];
    (
      node["amenity"~"water_point|drinking_water|well"](0.8,39.5,2.5,41.2);
      node["man_made"~"water_well|water_works"](0.8,39.5,2.5,41.2);
    );
    out body; >; out skel qt;
  `, 'water')
}

export async function fetchRoads(): Promise<OSMFeature[]> {
  return overpassQuery(`
    [out:json][timeout:30];
    way["highway"~"primary|secondary|tertiary"](0.8,39.5,2.5,41.2);
    out body; >; out skel qt;
  `, 'roads')
}

// Convert OSM nodes/ways to GeoJSON points
export function osmToGeoJSONPoints(features: OSMFeature[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: features
      .filter(f => f.lat && f.lon)
      .map(f => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [f.lon!, f.lat!] },
        properties: { id: f.id, ...f.tags }
      }))
  }
}
```

### `src/lib/api/usgs.ts`

```typescript
export interface Earthquake {
  id: string
  magnitude: number
  place: string
  time: number
  latitude: number
  longitude: number
  depth: number
}

export async function fetchEarthquakes(): Promise<Earthquake[]> {
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)
  
  const fmt = (d: Date) => d.toISOString()
  
  const params = new URLSearchParams({
    format: 'geojson',
    starttime: fmt(thirtyDaysAgo),
    endtime: fmt(today),
    minlatitude: '0.0',
    maxlatitude: '3.0',
    minlongitude: '39.0',
    maxlongitude: '42.0',
    minmagnitude: '2.0',
    orderby: 'time',
    limit: '50'
  })
  
  const response = await fetch(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`)
  if (!response.ok) throw new Error('USGS fetch failed')
  
  const data = await response.json() as GeoJSON.FeatureCollection
  
  return data.features.map(f => ({
    id: f.id as string,
    magnitude: (f.properties as any).mag,
    place: (f.properties as any).place,
    time: (f.properties as any).time,
    latitude: (f.geometry as GeoJSON.Point).coordinates[1],
    longitude: (f.geometry as GeoJSON.Point).coordinates[0],
    depth: (f.geometry as GeoJSON.Point).coordinates[2]
  }))
}
```

### `src/lib/api/unhcr.ts`

```typescript
export interface UNHCRPopulation {
  year: number
  refugees: number
  asylum_seekers: number
  total: number
}

export async function fetchUNHCRData(): Promise<UNHCRPopulation[]> {
  try {
    const response = await fetch(
      'https://api.unhcr.org/population/v1/population/?limit=10&dataset=population&displayType=totals&location=KEN&yearFrom=2019&yearTo=2024&type=REF'
    )
    if (!response.ok) throw new Error('UNHCR API failed')
    
    const data = await response.json()
    
    // Parse UNHCR response structure
    return (data.items || []).map((item: any) => ({
      year: parseInt(item.year),
      refugees: parseInt(item.REF || '0'),
      asylum_seekers: parseInt(item.ASY || '0'),
      total: parseInt(item.REF || '0') + parseInt(item.ASY || '0')
    })).sort((a: UNHCRPopulation, b: UNHCRPopulation) => a.year - b.year)
  } catch {
    // Fallback static data (published UNHCR figures)
    return [
      { year: 2019, refugees: 467167, asylum_seekers: 20148, total: 487315 },
      { year: 2020, refugees: 533438, asylum_seekers: 25896, total: 559334 },
      { year: 2021, refugees: 542490, asylum_seekers: 27315, total: 569805 },
      { year: 2022, refugees: 589753, asylum_seekers: 39812, total: 629565 },
      { year: 2023, refugees: 647430, asylum_seekers: 52341, total: 699771 },
      { year: 2024, refugees: 695000, asylum_seekers: 58000, total: 753000 }
    ]
  }
}
```

---

## STORE SPECIFICATIONS

Use Svelte 5 runes (`$state`, `$derived`, `$effect`) throughout.

### `src/lib/stores/dataStore.svelte.ts`

```typescript
import type { FIRMSHotspot } from '$lib/api/firms'
import type { WeatherData, DroughtAssessment } from '$lib/api/openmeteo'
import type { OSMFeature } from '$lib/api/overpass'
import type { Earthquake } from '$lib/api/usgs'
import type { UNHCRPopulation } from '$lib/api/unhcr'

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

interface DataState {
  fires: FIRMSHotspot[]
  weather: WeatherData | null
  drought: DroughtAssessment | null
  healthFacilities: OSMFeature[]
  waterPoints: OSMFeature[]
  roads: OSMFeature[]
  earthquakes: Earthquake[]
  population: UNHCRPopulation[]
  loading: Record<string, LoadingState>
  errors: Record<string, string>
  firmsIsDemo: boolean
  lastUpdated: Date | null
}

// Export as reactive state
export const data = $state<DataState>({
  fires: [],
  weather: null,
  drought: null,
  healthFacilities: [],
  waterPoints: [],
  roads: [],
  earthquakes: [],
  population: [],
  loading: {},
  errors: {},
  firmsIsDemo: false,
  lastUpdated: null
})

export async function loadAllData() {
  // Load all APIs in parallel with individual error handling
  // Update data.loading[key] to 'loading', then 'success' or 'error'
  // This allows partial loading — map shows whatever is ready
}
```

### `src/lib/stores/layerStore.svelte.ts`

```typescript
export interface LayerConfig {
  id: string
  label: string
  description: string
  color: string
  visible: boolean
  loading: boolean
  count?: number
}

export const layers = $state<LayerConfig[]>([
  { id: 'risk-grid', label: 'Composite Risk Index', description: 'Spatial composite of all hazards', color: '#ef4444', visible: true, loading: false },
  { id: 'fire-hotspots', label: 'Fire Hotspots (FIRMS/NASA)', description: 'VIIRS satellite fire detections, last 7 days', color: '#f97316', visible: true, loading: false },
  { id: 'drought-zones', label: 'Drought Zones (FEWS NET)', description: 'IPC Integrated Food Security Phase Classification', color: '#eab308', visible: true, loading: false },
  { id: 'flood-zones', label: 'Flood-Prone Areas', description: 'Seasonal wadi/drainage channel extents (SRTM-derived)', color: '#3b82f6', visible: true, loading: false },
  { id: 'camps', label: 'Camp Settlements (UNHCR)', description: 'Dadaab refugee complex camp locations', color: '#22c55e', visible: true, loading: false },
  { id: 'health', label: 'Health Facilities (OSM)', description: 'Hospitals, clinics, health centres', color: '#a855f7', visible: false, loading: false },
  { id: 'water', label: 'Water Points (OSM)', description: 'Water points, wells, water works', color: '#06b6d4', visible: false, loading: false },
  { id: 'earthquakes', label: 'Seismic Activity (USGS)', description: 'Earthquakes M2.0+, last 30 days', color: '#ec4899', visible: false, loading: false },
])
```

---

## MAPLIBRE LAYER SPECIFICATIONS

Add layers in this order (bottom to top):

```typescript
function addAllLayers(map: Map, mapData: typeof data) {
  // 1. Risk grid (fill, lowest)
  addRiskGrid(map)
  
  // 2. Drought zones (fill + dashed outline)
  map.addSource('drought-zones', {
    type: 'geojson',
    data: droughtZonesToGeoJSON(DROUGHT_ZONES)
  })
  map.addLayer({
    id: 'drought-zones-fill',
    type: 'fill',
    source: 'drought-zones',
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': 0.18
    }
  })
  map.addLayer({
    id: 'drought-zones-line',
    type: 'line',
    source: 'drought-zones',
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 1.5,
      'line-dasharray': [6, 4]
    }
  })
  
  // 3. Flood zones
  map.addSource('flood-zones', {
    type: 'geojson',
    data: floodZonesToGeoJSON(FLOOD_ZONES)
  })
  map.addLayer({
    id: 'flood-zones-fill',
    type: 'fill',
    source: 'flood-zones',
    paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.28 }
  })
  map.addLayer({
    id: 'flood-zones-line',
    type: 'line',
    source: 'flood-zones',
    paint: { 'line-color': '#93c5fd', 'line-width': 1.5 }
  })
  
  // 4. Roads (if loaded)
  // 5. Water points (if loaded)
  // 6. Health facilities (if loaded)
  
  // 7. Fire hotspots (circle, sized by FRP)
  map.addSource('fire-hotspots', {
    type: 'geojson',
    data: firesToGeoJSON(mapData.fires)
  })
  map.addLayer({
    id: 'fire-hotspots',
    type: 'circle',
    source: 'fire-hotspots',
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['get', 'frp'],
        0, 5,
        10, 7,
        50, 12
      ],
      'circle-color': [
        'match', ['get', 'confidence'],
        'high', '#ef4444',
        'nominal', '#f97316',
        '#fbbf24'
      ],
      'circle-stroke-color': '#fff',
      'circle-stroke-width': 1,
      'circle-opacity': 0.85
    }
  })
  
  // 8. Earthquakes
  // 9. Camps (top — always visible above everything)
  
  // Add popups on click for camps and fire hotspots
  map.on('click', 'fire-hotspots', (e) => { /* show popup */ })
  map.on('click', 'camps', (e) => { /* show popup */ })
  map.on('mouseenter', 'fire-hotspots', () => { map.getCanvas().style.cursor = 'pointer' })
  map.on('mouseleave', 'fire-hotspots', () => { map.getCanvas().style.cursor = '' })
}
```

**Layer visibility toggling:**
```typescript
function setLayerVisibility(map: Map, layerId: string, visible: boolean) {
  const visibility = visible ? 'visible' : 'none'
  // Some layers have multiple sub-layers (-fill, -line, -hotspots etc.)
  const subLayers = map.getStyle().layers
    .filter(l => l.id === layerId || l.id.startsWith(`${layerId}-`))
    .map(l => l.id)
  
  subLayers.forEach(id => map.setLayoutProperty(id, 'visibility', visibility))
}
```

**Theme switching:**
```typescript
// When theme changes, swap base style and re-add all layers
$effect(() => {
  const isDark = $themeStore
  if (!mapInstance || !mapInstance.isStyleLoaded()) return
  
  const newStyle = isDark
    ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
    : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
  
  mapInstance.setStyle(newStyle)
  mapInstance.once('styledata', () => {
    addAllLayers(mapInstance, data)
    // Restore visibility state from layerStore
    layers.forEach(l => setLayerVisibility(mapInstance, l.id, l.visible))
  })
})
```

---

## COMPONENT SPECIFICATIONS

### Header.svelte
```
Height: 56px, sticky top-0 z-50
Left: 🌍 icon + "Dadaab" (accent color) + " Climate Risk Dashboard" + "KEN" badge
Center (desktop): Live API status indicators — small colored dots per data source
Right: ThemeToggle + last updated timestamp
Mobile: hide center section, show hamburger to open MobileSheet
Blur backdrop: backdrop-blur-sm bg-background/80 border-b
```

### Sidebar.svelte (desktop ≥ lg, width 300px)
```
Sections in order, separated by Separator:
1. Stats Bar (2x2 grid of shadcn Cards)
2. Layer Controls (LayerControls.svelte)
3. Weather Panel (WeatherPanel.svelte)  
4. Drought Index (DroughtIndex.svelte)
5. Hazard Summary (HazardSummary.svelte)
6. Population Panel (PopulationPanel.svelte)
7. Data Sources (DataSources.svelte)
```

### StatsBar.svelte
4 stat cards in 2x2 grid:
- **Total Population** — from UNHCR live data (most recent year), label "Refugees in Kenya"
- **Active Fires** — count from FIRMS, sub-label "Last 7 days (VIIRS)"
- **Drought Severity** — from Open-Meteo calculation, badge with severity color
- **Earthquakes** — count from USGS, sub-label "M2.0+, last 30 days"

### WeatherPanel.svelte
```
Current conditions at Dadaab (1.65°N 40.35°E):
- Weather code emoji + label
- Temperature, humidity, wind speed in a 3-column mini-grid
- 7-day precipitation probability as a bar sparkline (pure SVG, no chart library)
  Each bar: height proportional to probability %, colored blue
  X-axis labels: day names (Mon, Tue...)
```

### DroughtIndex.svelte
```
Title: "30-Day Drought Index"
Subtitle: "ET₀ vs Precipitation Deficit"
Visual: A horizontal gauge bar (CSS)
  - Track: gray
  - Fill: colored based on severity (green → yellow → orange → red)
  - Filled to percentage of max expected deficit (300mm max)
Stats below: "ET₀: Xmm | Rain: Xmm | Deficit: Xmm"
Badge: severity label with appropriate color
Source: "Source: Open-Meteo Archive API"
```

### HazardSummary.svelte
Table rows using shadcn Badge for risk levels:
```
🔥 Fire Hazard          [derived from FIRMS hotspot count]
💧 Flood Risk           [static HIGH for Dadaab area]
🏜️ Drought Severity     [derived from Open-Meteo ET0 deficit]
🌍 Seismic Background   [derived from USGS earthquake count]
👥 Social Vulnerability [static HIGH — refugee camp context]
```
Risk level computation:
- Fire: 0 fires → LOW, 1-5 → MEDIUM, 6-15 → HIGH, >15 → CRITICAL
- Drought: pass through from droughtCalc
- Seismic: 0 → LOW, 1-3 → MEDIUM, >3 → HIGH

### PopulationPanel.svelte
```
Title: "Refugee Population Trend"
Source: UNHCR Data API
- Total current year figure (large, bold)
- Sub-label: "Refugees + Asylum Seekers in Kenya"
- Mini sparkline: 6-bar chart (2019-2024), pure SVG
  Bars growing taller left to right showing the trend
  Y-axis: 0 to 800k
  X-axis: year labels
- Note: "Data: UNHCR Refugee Population Statistics"
```

### DataSources.svelte
```
Small section at bottom of sidebar:
"Live Data Sources"
List each with colored status dot (green = loaded, yellow = loading, red = error, gray = not configured):
• NASA FIRMS (fires) — [status]
• Open-Meteo (weather) — [status]
• UNHCR (population) — [status]  
• OpenStreetMap/Overpass — [status]
• USGS (earthquakes) — [status]
• FEWS NET (drought zones) — static
• SRTM/DEM (flood zones) — static
```

### MobileSheet.svelte
```
Uses shadcn Sheet, side="bottom", 85vh height
Trigger: FAB fixed bottom-right, shows Layers icon with count badge
Handle bar at top for drag-to-dismiss
Same content as Sidebar, scrollable
```

### LoadingOverlay.svelte
```
Shows on initial data load (first 2-3 seconds)
Full-screen overlay with:
- AVSI-style humanitarian branding
- "Loading climate risk data..." message
- Progress: list of data sources with loading spinners → checkmarks
- Fade out once all critical data is loaded
```

---

## DESIGN SYSTEM & THEME

### Design Direction
**Utilitarian precision meets humanitarian urgency.** This is a tool that field workers and DRR specialists would use, not a consumer app. The aesthetic should read as professional, data-dense, and serious — like a war room display. Not clinical white, not playful. Dark mode default, light mode clean and functional.

### Typography
```css
/* Use Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

--font-sans: 'IBM Plex Sans', sans-serif;
--font-mono: 'IBM Plex Mono', monospace;
/* IBM Plex suggests precision, technical seriousness, UN/NGO organisational aesthetic */
/* Mono for coordinates, data values, timestamps */
```

### Color Tokens (extend shadcn defaults in app.css)
```css
:root {
  /* Risk scale */
  --risk-critical: 5 5% 35%;       /* #8b0000 */
  --risk-high: 0 79% 58%;           /* #ef4444 */
  --risk-medium: 25 95% 53%;        /* #f97316 */
  --risk-low-medium: 48 96% 53%;    /* #eab308 */
  --risk-low: 142 71% 45%;          /* #22c55e */
  
  /* Map accent */
  --fire: 14 100% 57%;
  --flood: 217 91% 60%;
  --drought: 38 92% 50%;
  --camp: 142 71% 45%;
  --seismic: 336 80% 58%;
}

.dark {
  --background: 222 47% 7%;
  --card: 222 40% 11%;
  --border: 222 35% 18%;
  --muted: 222 35% 18%;
  --muted-foreground: 215 20% 55%;
}
```

### Spacing & Layout
```
Header height: 56px (h-14)
Sidebar width: 300px (w-[300px])
Sidebar padding: p-4
Panel card padding: p-3
Border radius: rounded-md throughout (not rounded-lg)
Gap between sidebar sections: gap-3
```

---

## RESPONSIVE LAYOUT SPECIFICATION

```svelte
<!-- routes/+page.svelte structure -->
<div class="flex flex-col h-screen overflow-hidden">
  <Header />
  
  <div class="flex flex-1 overflow-hidden">
    <!-- Desktop sidebar -->
    <aside class="hidden lg:flex flex-col w-[300px] shrink-0 border-r overflow-y-auto">
      <Sidebar />
    </aside>
    
    <!-- Map container -->
    <main class="relative flex-1 min-w-0">
      <MapContainer />
      <RiskLegend class="absolute bottom-8 right-4 z-10" />
      <MapAttribution class="absolute bottom-2 left-2 z-10" />
      
      <!-- Mobile stats strip (horizontal scroll) -->
      <div class="lg:hidden absolute top-2 left-2 right-2 z-10">
        <MobileStatsStrip />
      </div>
      
      <!-- Mobile FAB -->
      <button class="lg:hidden absolute bottom-6 right-4 z-20 ...">
        <Layers size={20} />
        <span class="badge">{visibleCount}</span>
      </button>
    </main>
  </div>
  
  <!-- Mobile sheet (outside main layout flow) -->
  <MobileSheet />
</div>
```

**Mobile StatsStrip:** Horizontal scrolling row of pill-shaped stat chips (fires count, drought level, population) — visible on mobile above the map.

**Map height:** Always fills remaining viewport. Never a fixed px height. Use `h-full` and ensure parent chain is `h-screen`.

---

## ENV CONFIGURATION

### `.env.example` (commit this)
```env
# NASA FIRMS Fire Information for Resource Management System
# Get your free MAP key at: https://firms.modaps.eosdis.nasa.gov/api/area/
# Leave empty or set to 'demo' to use fallback data
PUBLIC_FIRMS_MAP_KEY=demo
```

### `.env` (gitignored)
```env
PUBLIC_FIRMS_MAP_KEY=your_actual_key_here
```

---

## README.md

Generate a professional README that includes:

```markdown
# Dadaab Climate Risk Dashboard

A production-grade GIS web application for climate hazard monitoring and 
disaster risk reduction in the Dadaab refugee complex, Garissa County, Kenya.

Built as a portfolio demonstration of GIS web development capabilities using 
real-time open geospatial data.

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
[list stack]

## Getting Started

\`\`\`bash
pnpm install
cp .env.example .env
# Optionally add your NASA FIRMS MAP key to .env
pnpm dev
\`\`\`

## API Keys

### NASA FIRMS (Optional)
Register for a free MAP key at https://firms.modaps.eosdis.nasa.gov/api/area/
Without a key, fire hotspot data falls back to representative demo points.

All other APIs are keyless and work out of the box.

## Deployment
\`\`\`bash
vercel --prod
\`\`\`
Set PUBLIC_FIRMS_MAP_KEY in Vercel environment variables.

## Data Disclaimer
[standard humanitarian data disclaimer]
```

---

## QUALITY & POLISH REQUIREMENTS

1. **TypeScript:** Strict mode, no `any`, all API responses typed before use
2. **Error states:** Every data source has independent error handling — one failing API should not break the whole dashboard
3. **Loading states:** Skeleton loaders in stat cards while data loads, not blank space
4. **Accessibility:** All interactive elements have aria-labels; map has `role="region" aria-label="Dadaab climate risk map"`; sufficient color contrast in both themes
5. **Performance:**
   - Overpass results cached in sessionStorage (don't re-fetch on tab focus)
   - MapLibre sources updated in-place with `map.getSource(id).setData(newData)` — never remove and re-add
   - All API calls parallelised with `Promise.allSettled`
6. **No SSR issues:** All MapLibre and browser API code inside `onMount`. No `window`/`document` at module level
7. **Mobile gestures:** Map supports pinch-zoom and two-finger pan natively via MapLibre. Don't intercept touch events
8. **Svelte 5:** `$state`, `$derived`, `$effect` runes throughout — no legacy `writable()` stores
9. **shadcn-svelte:** Use the actual library components — Card, Badge, Switch, Sheet, Separator, Button — not custom recreations

---

## DELIVERABLE ORDER

Generate ALL files in this order:

1. `package.json`
2. `svelte.config.js`
3. `vite.config.ts`
4. `tailwind.config.ts`
5. `.env.example`
6. `src/app.html`
7. `src/app.css`
8. `src/lib/types/index.ts`
9. `src/lib/data/camps.ts`
10. `src/lib/data/droughtZones.ts`
11. `src/lib/data/floodZones.ts`
12. `src/lib/utils/riskColors.ts`
13. `src/lib/utils/csvParser.ts`
14. `src/lib/utils/droughtCalc.ts`
15. `src/lib/utils/dateUtils.ts`
16. `src/lib/utils/geojson.ts`
17. `src/lib/api/firms.ts`
18. `src/lib/api/openmeteo.ts`
19. `src/lib/api/overpass.ts`
20. `src/lib/api/usgs.ts`
21. `src/lib/api/unhcr.ts`
22. `src/lib/stores/themeStore.svelte.ts`
23. `src/lib/stores/layerStore.svelte.ts`
24. `src/lib/stores/dataStore.svelte.ts`
25. `src/lib/stores/mapStore.svelte.ts`
26. `src/lib/components/map/MapContainer.svelte`
27. `src/lib/components/map/LayerControls.svelte`
28. `src/lib/components/map/RiskLegend.svelte`
29. `src/lib/components/map/MapAttribution.svelte`
30. `src/lib/components/charts/RainfallSparkline.svelte`
31. `src/lib/components/charts/PopTrend.svelte`
32. `src/lib/components/panels/StatsBar.svelte`
33. `src/lib/components/panels/WeatherPanel.svelte`
34. `src/lib/components/panels/DroughtIndex.svelte`
35. `src/lib/components/panels/HazardSummary.svelte`
36. `src/lib/components/panels/PopulationPanel.svelte`
37. `src/lib/components/panels/DataSources.svelte`
38. `src/lib/components/layout/Header.svelte`
39. `src/lib/components/layout/Sidebar.svelte`
40. `src/lib/components/layout/MobileSheet.svelte`
41. `src/lib/components/layout/ThemeToggle.svelte`
42. `src/lib/components/layout/LoadingOverlay.svelte`
43. `src/routes/+layout.ts`
44. `src/routes/+layout.svelte`
45. `src/routes/+page.svelte`
46. `README.md`
47. `vercel.json`

After all files, provide the exact commands to:
- Install dependencies
- Run locally
- Deploy to Vercel
- Configure the FIRMS API key
