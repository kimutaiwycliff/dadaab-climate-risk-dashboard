export interface Basemap {
	id: string;
	label: string;
	style: string | object;
	preview: string; // CSS color for preview swatch
}

export const BASEMAPS: Basemap[] = [
	{
		id: 'dark',
		label: 'Dark Matter',
		style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
		preview: '#1a1a2e'
	},
	{
		id: 'light',
		label: 'Positron',
		style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
		preview: '#f5f5f0'
	},
	{
		id: 'voyager',
		label: 'Voyager',
		style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
		preview: '#e8f4f8'
	},
	{
		id: 'satellite',
		label: 'Satellite',
		style: {
			version: 8,
			sources: {
				'esri-imagery': {
					type: 'raster',
					tiles: [
						'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
					],
					tileSize: 256,
					attribution: '© Esri, Maxar, Earthstar Geographics'
				}
			},
			layers: [{ id: 'esri-imagery', type: 'raster', source: 'esri-imagery' }]
		},
		preview: '#2d4a1e'
	}
];

export const basemapState = $state({ current: 'dark' });
