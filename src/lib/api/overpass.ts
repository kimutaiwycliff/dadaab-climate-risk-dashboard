import type { OSMFeature } from '$lib/types';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const CACHE_KEY_PREFIX = 'dadaab_overpass_';

async function overpassQuery(query: string, cacheKey: string): Promise<OSMFeature[]> {
	const cached = sessionStorage.getItem(`${CACHE_KEY_PREFIX}${cacheKey}`);
	if (cached) {
		try {
			return JSON.parse(cached) as OSMFeature[];
		} catch {
			sessionStorage.removeItem(`${CACHE_KEY_PREFIX}${cacheKey}`);
		}
	}

	const response = await fetch(OVERPASS_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: `data=${encodeURIComponent(query)}`
	});

	if (!response.ok) throw new Error(`Overpass error: ${response.status}`);
	const data = (await response.json()) as { elements: OSMFeature[] };
	const elements = data.elements;

	try {
		sessionStorage.setItem(`${CACHE_KEY_PREFIX}${cacheKey}`, JSON.stringify(elements));
	} catch {
		// sessionStorage quota exceeded — ignore
	}
	return elements;
}

export async function fetchHealthFacilities(): Promise<OSMFeature[]> {
	return overpassQuery(
		`
    [out:json][timeout:25];
    (
      node["amenity"~"hospital|clinic|health_centre|doctors"](0.8,39.5,2.5,41.2);
      way["amenity"~"hospital|clinic|health_centre|doctors"](0.8,39.5,2.5,41.2);
    );
    out body; >; out skel qt;
  `,
		'health'
	);
}

export async function fetchWaterPoints(): Promise<OSMFeature[]> {
	return overpassQuery(
		`
    [out:json][timeout:25];
    (
      node["amenity"~"water_point|drinking_water|well"](0.8,39.5,2.5,41.2);
      node["man_made"~"water_well|water_works"](0.8,39.5,2.5,41.2);
    );
    out body; >; out skel qt;
  `,
		'water'
	);
}

export async function fetchRoads(): Promise<OSMFeature[]> {
	return overpassQuery(
		`
    [out:json][timeout:30];
    way["highway"~"primary|secondary|tertiary"](0.8,39.5,2.5,41.2);
    out body; >; out skel qt;
  `,
		'roads'
	);
}

export function osmToGeoJSONPoints(features: OSMFeature[]): GeoJSON.FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: features
			.filter((f) => f.lat != null && f.lon != null)
			.map((f) => ({
				type: 'Feature' as const,
				geometry: { type: 'Point' as const, coordinates: [f.lon!, f.lat!] },
				properties: { id: f.id, ...f.tags }
			}))
	};
}
