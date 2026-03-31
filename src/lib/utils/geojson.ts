import type { Camp, DroughtZone, FloodZone, FIRMSHotspot, Earthquake } from '$lib/types';

export function campsToGeoJSON(camps: Camp[]): GeoJSON.FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: camps.map((c) => ({
			type: 'Feature' as const,
			geometry: { type: 'Point' as const, coordinates: [c.lng, c.lat] },
			properties: {
				id: c.id,
				name: c.name,
				established: c.established,
				area_km2: c.area_km2,
				description: c.description
			}
		}))
	};
}

export function droughtZonesToGeoJSON(zones: DroughtZone[]): GeoJSON.FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: zones.map((z) => ({
			type: 'Feature' as const,
			geometry: {
				type: 'Polygon' as const,
				coordinates: [z.coordinates]
			},
			properties: {
				id: z.id,
				label: z.label,
				description: z.description,
				color: z.color
			}
		}))
	};
}

export function floodZonesToGeoJSON(zones: FloodZone[]): GeoJSON.FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: zones.map((z) => ({
			type: 'Feature' as const,
			geometry: {
				type: 'Polygon' as const,
				coordinates: [z.coordinates]
			},
			properties: { id: z.id, label: z.label }
		}))
	};
}

export function firesToGeoJSON(fires: FIRMSHotspot[]): GeoJSON.FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: fires.map((f, i) => ({
			type: 'Feature' as const,
			geometry: { type: 'Point' as const, coordinates: [f.longitude, f.latitude] },
			properties: {
				id: i,
				brightness: f.brightness,
				confidence: f.confidence,
				acq_date: f.acq_date,
				acq_time: f.acq_time,
				satellite: f.satellite,
				frp: f.frp,
				daynight: f.daynight
			}
		}))
	};
}

export function earthquakesToGeoJSON(quakes: Earthquake[]): GeoJSON.FeatureCollection {
	return {
		type: 'FeatureCollection',
		features: quakes.map((q) => ({
			type: 'Feature' as const,
			geometry: { type: 'Point' as const, coordinates: [q.longitude, q.latitude] },
			properties: {
				id: q.id,
				magnitude: q.magnitude,
				place: q.place,
				time: q.time,
				depth: q.depth
			}
		}))
	};
}

// Generate a simple risk grid GeoJSON over Dadaab area
export function generateRiskGrid(
	fireCount: number,
	droughtSeverity: string
): GeoJSON.FeatureCollection {
	const cells: GeoJSON.Feature[] = [];
	const west = 39.6, south = 0.9, east = 41.1, north = 2.4;
	const step = 0.1;

	const droughtScore = { extreme: 90, severe: 70, moderate: 50, normal: 20 }[droughtSeverity] ?? 20;
	const fireScore = Math.min(100, fireCount * 5);

	for (let lng = west; lng < east; lng += step) {
		for (let lat = south; lat < north; lat += step) {
			// Score varies by proximity to camp area (center ~1.68, 40.35)
			const distToCamp = Math.sqrt(
				Math.pow(lng - 40.35, 2) + Math.pow(lat - 1.68, 2)
			);
			const proximityScore = Math.max(0, 100 - distToCamp * 200);

			const score = Math.min(
				100,
				(droughtScore * 0.4 + fireScore * 0.3 + proximityScore * 0.3)
			);

			cells.push({
				type: 'Feature',
				geometry: {
					type: 'Polygon',
					coordinates: [[
						[lng, lat],
						[lng + step, lat],
						[lng + step, lat + step],
						[lng, lat + step],
						[lng, lat]
					]]
				},
				properties: { score }
			});
		}
	}

	return { type: 'FeatureCollection', features: cells };
}
