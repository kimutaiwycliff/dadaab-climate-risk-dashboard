export interface LayerConfig {
	id: string;
	label: string;
	description: string;
	color: string;
	visible: boolean;
	loading: boolean;
	count?: number;
}

export const layers = $state<LayerConfig[]>([
	{
		id: 'risk-grid',
		label: 'Composite Risk Index',
		description: 'Spatial composite of all hazards',
		color: '#ef4444',
		visible: true,
		loading: false
	},
	{
		id: 'fire-hotspots',
		label: 'Fire Hotspots (FIRMS/NASA)',
		description: 'VIIRS satellite fire detections, last 7 days',
		color: '#f97316',
		visible: true,
		loading: false
	},
	{
		id: 'drought-zones',
		label: 'Drought Zones (FEWS NET)',
		description: 'IPC Integrated Food Security Phase Classification',
		color: '#eab308',
		visible: true,
		loading: false
	},
	{
		id: 'flood-zones',
		label: 'Flood-Prone Areas',
		description: 'Seasonal wadi/drainage channel extents (SRTM-derived)',
		color: '#3b82f6',
		visible: true,
		loading: false
	},
	{
		id: 'camps',
		label: 'Camp Settlements (UNHCR)',
		description: 'Dadaab refugee complex camp locations',
		color: '#22c55e',
		visible: true,
		loading: false
	},
	{
		id: 'health',
		label: 'Health Facilities (OSM)',
		description: 'Hospitals, clinics, health centres',
		color: '#a855f7',
		visible: false,
		loading: false
	},
	{
		id: 'water',
		label: 'Water Points (OSM)',
		description: 'Water points, wells, water works',
		color: '#06b6d4',
		visible: false,
		loading: false
	},
	{
		id: 'earthquakes',
		label: 'Seismic Activity (USGS)',
		description: 'Earthquakes M2.0+, last 30 days',
		color: '#ec4899',
		visible: false,
		loading: false
	}
]);
