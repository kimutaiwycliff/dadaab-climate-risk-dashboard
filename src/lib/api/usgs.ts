import type { Earthquake } from '$lib/types';

const fmt = (d: Date): string => d.toISOString();

export async function fetchEarthquakes(): Promise<Earthquake[]> {
	const today = new Date();
	const thirtyDaysAgo = new Date(today);
	thirtyDaysAgo.setDate(today.getDate() - 30);

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
	});

	const response = await fetch(
		`https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`
	);
	if (!response.ok) throw new Error('USGS fetch failed');

	const data = (await response.json()) as GeoJSON.FeatureCollection;

	return data.features.map((f) => {
		const props = f.properties as Record<string, unknown>;
		const geom = f.geometry as GeoJSON.Point;
		return {
			id: f.id as string,
			magnitude: props.mag as number,
			place: props.place as string,
			time: props.time as number,
			latitude: geom.coordinates[1],
			longitude: geom.coordinates[0],
			depth: geom.coordinates[2]
		};
	});
}
