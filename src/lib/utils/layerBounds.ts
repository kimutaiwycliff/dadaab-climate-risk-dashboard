import type { Map } from 'maplibre-gl';
import { data } from '$lib/stores/dataStore.svelte';
import { DADAAB_CAMPS, DROUGHT_ZONES, FLOOD_ZONES } from '$lib/data/camps';

type LngLat = [number, number];

function boundsFromPoints(points: LngLat[]): [[number, number], [number, number]] | null {
	if (points.length === 0) return null;
	let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
	for (const [lng, lat] of points) {
		if (lng < minLng) minLng = lng;
		if (lng > maxLng) maxLng = lng;
		if (lat < minLat) minLat = lat;
		if (lat > maxLat) maxLat = lat;
	}
	// Add a small buffer if it's a single point
	const buf = 0.05;
	if (minLng === maxLng) { minLng -= buf; maxLng += buf; }
	if (minLat === maxLat) { minLat -= buf; maxLat += buf; }
	return [[minLng, minLat], [maxLng, maxLat]];
}

export function zoomToLayer(map: Map, layerId: string) {
	let points: LngLat[] = [];

	switch (layerId) {
		case 'fire-hotspots':
			points = data.fires.map((f) => [f.longitude, f.latitude]);
			break;
		case 'camps':
			points = DADAAB_CAMPS.map((c) => [c.lng, c.lat]);
			break;
		case 'earthquakes':
			points = data.earthquakes.map((e) => [e.longitude, e.latitude]);
			break;
		case 'health':
			points = data.healthFacilities
				.filter((f) => f.lat != null && f.lon != null)
				.map((f) => [f.lon!, f.lat!]);
			break;
		case 'water':
			points = data.waterPoints
				.filter((f) => f.lat != null && f.lon != null)
				.map((f) => [f.lon!, f.lat!]);
			break;
		case 'drought-zones':
			points = DROUGHT_ZONES.flatMap((z) => z.coordinates as LngLat[]);
			break;
		case 'flood-zones':
			points = FLOOD_ZONES.flatMap((z) => z.coordinates as LngLat[]);
			break;
		default:
			// Whole Dadaab area
			points = [[39.5, 0.8], [41.2, 2.5]];
	}

	if (points.length === 0) {
		// Fall back to full Dadaab extent
		points = [[39.5, 0.8], [41.2, 2.5]];
	}

	const bounds = boundsFromPoints(points);
	if (!bounds) return;

	map.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 800 });
}
