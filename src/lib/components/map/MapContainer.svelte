<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Map, Popup } from 'maplibre-gl';
	import { data } from '$lib/stores/dataStore.svelte';
	import { layers } from '$lib/stores/layerStore.svelte';
	import { theme } from '$lib/stores/themeStore.svelte';
	import { mapState } from '$lib/stores/mapStore.svelte';
	import { DADAAB_CAMPS, DROUGHT_ZONES, FLOOD_ZONES } from '$lib/data/camps';
	import {
		campsToGeoJSON,
		droughtZonesToGeoJSON,
		floodZonesToGeoJSON,
		firesToGeoJSON,
		earthquakesToGeoJSON,
		generateRiskGrid
	} from '$lib/utils/geojson';
	import { osmToGeoJSONPoints } from '$lib/api/overpass';

	let mapContainer: HTMLDivElement;
	let map: Map | null = null;
	let popup: Popup | null = null;
	let layersAdded = false;

	const DARK_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
	const LIGHT_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

	function getStyle() {
		return theme.isDark ? DARK_STYLE : LIGHT_STYLE;
	}

	async function addAllLayers(m: Map) {
		const { default: MapLibre } = await import('maplibre-gl');

		// 1. Risk grid
		const riskData = generateRiskGrid(data.fires.length, data.drought?.severity ?? 'severe');
		if (!m.getSource('risk-grid')) {
			m.addSource('risk-grid', { type: 'geojson', data: riskData });
		}
		if (!m.getLayer('risk-grid-fill')) {
			m.addLayer({
				id: 'risk-grid-fill',
				type: 'fill',
				source: 'risk-grid',
				paint: {
					'fill-color': [
						'interpolate', ['linear'], ['get', 'score'],
						0, '#22c55e',
						30, '#eab308',
						50, '#f97316',
						70, '#ef4444',
						90, '#8b0000'
					],
					'fill-opacity': 0.22
				}
			});
		}

		// 2. Drought zones
		if (!m.getSource('drought-zones')) {
			m.addSource('drought-zones', { type: 'geojson', data: droughtZonesToGeoJSON(DROUGHT_ZONES) });
		}
		if (!m.getLayer('drought-zones-fill')) {
			m.addLayer({
				id: 'drought-zones-fill',
				type: 'fill',
				source: 'drought-zones',
				paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.18 }
			});
			m.addLayer({
				id: 'drought-zones-line',
				type: 'line',
				source: 'drought-zones',
				paint: { 'line-color': ['get', 'color'], 'line-width': 1.5, 'line-dasharray': [6, 4] }
			});
		}

		// 3. Flood zones
		if (!m.getSource('flood-zones')) {
			m.addSource('flood-zones', { type: 'geojson', data: floodZonesToGeoJSON(FLOOD_ZONES) });
		}
		if (!m.getLayer('flood-zones-fill')) {
			m.addLayer({
				id: 'flood-zones-fill',
				type: 'fill',
				source: 'flood-zones',
				paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.28 }
			});
			m.addLayer({
				id: 'flood-zones-line',
				type: 'line',
				source: 'flood-zones',
				paint: { 'line-color': '#93c5fd', 'line-width': 1.5 }
			});
		}

		// 4. Health facilities
		if (!m.getSource('health')) {
			m.addSource('health', {
				type: 'geojson',
				data: osmToGeoJSONPoints(data.healthFacilities)
			});
		}
		if (!m.getLayer('health-points')) {
			m.addLayer({
				id: 'health-points',
				type: 'circle',
				source: 'health',
				paint: {
					'circle-radius': 6,
					'circle-color': '#a855f7',
					'circle-stroke-color': '#fff',
					'circle-stroke-width': 1.5,
					'circle-opacity': 0.9
				},
				layout: { visibility: 'none' }
			});
		}

		// 5. Water points
		if (!m.getSource('water')) {
			m.addSource('water', {
				type: 'geojson',
				data: osmToGeoJSONPoints(data.waterPoints)
			});
		}
		if (!m.getLayer('water-points')) {
			m.addLayer({
				id: 'water-points',
				type: 'circle',
				source: 'water',
				paint: {
					'circle-radius': 5,
					'circle-color': '#06b6d4',
					'circle-stroke-color': '#fff',
					'circle-stroke-width': 1.5,
					'circle-opacity': 0.9
				},
				layout: { visibility: 'none' }
			});
		}

		// 6. Fire hotspots
		if (!m.getSource('fire-hotspots')) {
			m.addSource('fire-hotspots', { type: 'geojson', data: firesToGeoJSON(data.fires) });
		}
		if (!m.getLayer('fire-hotspots')) {
			m.addLayer({
				id: 'fire-hotspots',
				type: 'circle',
				source: 'fire-hotspots',
				paint: {
					'circle-radius': [
						'interpolate', ['linear'], ['get', 'frp'],
						0, 5, 10, 7, 50, 12
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
			});
		}

		// 7. Earthquakes
		if (!m.getSource('earthquakes')) {
			m.addSource('earthquakes', { type: 'geojson', data: earthquakesToGeoJSON(data.earthquakes) });
		}
		if (!m.getLayer('earthquakes-circles')) {
			m.addLayer({
				id: 'earthquakes-circles',
				type: 'circle',
				source: 'earthquakes',
				paint: {
					'circle-radius': ['interpolate', ['linear'], ['get', 'magnitude'], 2, 4, 5, 10, 8, 18],
					'circle-color': '#ec4899',
					'circle-stroke-color': '#fff',
					'circle-stroke-width': 1,
					'circle-opacity': 0.7
				},
				layout: { visibility: 'none' }
			});
		}

		// 8. Camps (top layer)
		if (!m.getSource('camps')) {
			m.addSource('camps', { type: 'geojson', data: campsToGeoJSON(DADAAB_CAMPS) });
		}
		if (!m.getLayer('camps')) {
			m.addLayer({
				id: 'camps',
				type: 'circle',
				source: 'camps',
				paint: {
					'circle-radius': 10,
					'circle-color': '#22c55e',
					'circle-stroke-color': '#fff',
					'circle-stroke-width': 2,
					'circle-opacity': 0.95
				}
			});
			m.addLayer({
				id: 'camps-labels',
				type: 'symbol',
				source: 'camps',
				layout: {
					'text-field': ['get', 'name'],
					'text-size': 11,
					'text-offset': [0, 1.6],
					'text-anchor': 'top',
					'text-font': ['Noto Sans Regular', 'Open Sans Regular']
				},
				paint: {
					'text-color': '#22c55e',
					'text-halo-color': theme.isDark ? '#0d1117' : '#ffffff',
					'text-halo-width': 2
				}
			});
		}

		// Popups
		m.on('click', 'fire-hotspots', (e) => {
			if (!e.features?.[0]) return;
			const props = e.features[0].properties as Record<string, string | number>;
			const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];
			popup?.remove();
			popup = new MapLibre.Popup({ closeButton: true, maxWidth: '260px' })
				.setLngLat(coords)
				.setHTML(`
					<div class="space-y-1">
						<div class="font-semibold text-orange-400">🔥 Fire Hotspot</div>
						<div>Brightness: <span class="font-mono">${props.brightness}K</span></div>
						<div>FRP: <span class="font-mono">${props.frp} MW</span></div>
						<div>Confidence: <span class="font-mono">${props.confidence}</span></div>
						<div>Detected: <span class="font-mono">${props.acq_date} ${props.acq_time}</span></div>
						<div>Satellite: <span class="font-mono">${props.satellite}</span></div>
					</div>
				`)
				.addTo(m);
		});

		m.on('click', 'camps', (e) => {
			if (!e.features?.[0]) return;
			const props = e.features[0].properties as Record<string, string | number>;
			const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];
			popup?.remove();
			popup = new MapLibre.Popup({ closeButton: true, maxWidth: '280px' })
				.setLngLat(coords)
				.setHTML(`
					<div class="space-y-1">
						<div class="font-semibold text-green-400">🏕️ ${props.name}</div>
						<div>Established: <span class="font-mono">${props.established}</span></div>
						<div>Area: <span class="font-mono">${props.area_km2} km²</span></div>
						<div class="text-xs text-gray-400 mt-1">${props.description}</div>
					</div>
				`)
				.addTo(m);
		});

		m.on('mouseenter', 'fire-hotspots', () => { m.getCanvas().style.cursor = 'pointer'; });
		m.on('mouseleave', 'fire-hotspots', () => { m.getCanvas().style.cursor = ''; });
		m.on('mouseenter', 'camps', () => { m.getCanvas().style.cursor = 'pointer'; });
		m.on('mouseleave', 'camps', () => { m.getCanvas().style.cursor = ''; });

		layersAdded = true;

		// Apply initial visibility from layer store
		layers.forEach((l) => setLayerVisibility(m, l.id, l.visible));
	}

	function setLayerVisibility(m: Map, layerId: string, visible: boolean) {
		if (!m.isStyleLoaded()) return;
		const visibility = visible ? 'visible' : 'none';
		const style = m.getStyle();
		if (!style?.layers) return;

		const subLayers = style.layers
			.filter((l) => l.id === layerId || l.id.startsWith(`${layerId}-`))
			.map((l) => l.id);

		subLayers.forEach((id) => {
			try { m.setLayoutProperty(id, 'visibility', visibility); } catch { /* ignore */ }
		});
	}

	function updateFireSource(m: Map) {
		const src = m.getSource('fire-hotspots') as { setData?: (d: GeoJSON.FeatureCollection) => void } | undefined;
		src?.setData?.(firesToGeoJSON(data.fires));
	}

	function updateEarthquakeSource(m: Map) {
		const src = m.getSource('earthquakes') as { setData?: (d: GeoJSON.FeatureCollection) => void } | undefined;
		src?.setData?.(earthquakesToGeoJSON(data.earthquakes));
	}

	function updateHealthSource(m: Map) {
		const src = m.getSource('health') as { setData?: (d: GeoJSON.FeatureCollection) => void } | undefined;
		src?.setData?.(osmToGeoJSONPoints(data.healthFacilities));
	}

	function updateWaterSource(m: Map) {
		const src = m.getSource('water') as { setData?: (d: GeoJSON.FeatureCollection) => void } | undefined;
		src?.setData?.(osmToGeoJSONPoints(data.waterPoints));
	}

	function updateRiskGrid(m: Map) {
		const src = m.getSource('risk-grid') as { setData?: (d: GeoJSON.FeatureCollection) => void } | undefined;
		src?.setData?.(generateRiskGrid(data.fires.length, data.drought?.severity ?? 'severe'));
	}

	onMount(async () => {
		const MapLibre = await import('maplibre-gl');

		map = new MapLibre.Map({
			container: mapContainer,
			style: getStyle(),
			center: [40.35, 1.68],
			zoom: 9,
			minZoom: 6,
			maxZoom: 16,
			attributionControl: false
		});

		mapState.instance = map;

		map.on('load', () => {
			if (map) addAllLayers(map);
		});

		// React to layer visibility changes
		$effect(() => {
			if (!map || !layersAdded) return;
			layers.forEach((l) => {
				if (map && map.isStyleLoaded()) setLayerVisibility(map, l.id, l.visible);
			});
		});

		// React to data changes
		$effect(() => {
			if (!map || !layersAdded || !map.isStyleLoaded()) return;
			if (data.fires.length > 0) updateFireSource(map);
		});

		$effect(() => {
			if (!map || !layersAdded || !map.isStyleLoaded()) return;
			if (data.earthquakes.length > 0) updateEarthquakeSource(map);
		});

		$effect(() => {
			if (!map || !layersAdded || !map.isStyleLoaded()) return;
			if (data.healthFacilities.length > 0) updateHealthSource(map);
		});

		$effect(() => {
			if (!map || !layersAdded || !map.isStyleLoaded()) return;
			if (data.waterPoints.length > 0) updateWaterSource(map);
		});

		$effect(() => {
			if (!map || !layersAdded || !map.isStyleLoaded()) return;
			if (data.drought) updateRiskGrid(map);
		});

		// Theme switching
		$effect(() => {
			const isDark = theme.isDark;
			if (!map) return;
			const newStyle = isDark ? DARK_STYLE : LIGHT_STYLE;
			map.setStyle(newStyle);
			map.once('styledata', () => {
				layersAdded = false;
				if (map) addAllLayers(map);
			});
		});
	});

	onDestroy(() => {
		popup?.remove();
		map?.remove();
		mapState.instance = null;
	});
</script>

<div
	bind:this={mapContainer}
	class="h-full w-full"
	role="region"
	aria-label="Dadaab climate risk map"
></div>
