export interface Basemap {
	id: string;
	label: string;
	style: string | object;
	preview: string;
}

const osmRasterStyle = () => ({
	version: 8 as const,
	sources: {
		'osm-tiles': {
			type: 'raster' as const,
			tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
			tileSize: 256,
			attribution: '© OpenStreetMap contributors'
		}
	},
	layers: [{ id: 'osm-tiles', type: 'raster' as const, source: 'osm-tiles' }]
});

export const BASEMAPS: Basemap[] = [
	{
		id: 'dark',
		label: 'Dark',
		style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
		preview: '#1a1a2e'
	},
	{
		id: 'osm',
		label: 'OSM',
		style: osmRasterStyle(),
		preview: '#b5d0d0'
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

/** Called by themeStore when theme changes — only auto-switches if on the paired basemap */
export function syncBasemapToTheme(isDark: boolean) {
	const paired = isDark ? 'dark' : 'osm';
	const opposite = isDark ? 'osm' : 'dark';
	// Auto-switch only if currently on the opposite theme's default
	if (basemapState.current === opposite) {
		basemapState.current = paired;
	}
}
