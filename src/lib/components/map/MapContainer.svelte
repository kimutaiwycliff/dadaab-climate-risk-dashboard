<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Map, Popup } from 'maplibre-gl';
	import { data } from '$lib/stores/dataStore.svelte';
	import { layers } from '$lib/stores/layerStore.svelte';
	import { mapState } from '$lib/stores/mapStore.svelte';
	import { basemapState, BASEMAPS } from '$lib/stores/basemapStore.svelte';
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
	let popup: Popup | null = null;
	// $state so that $effect calls at top-level can track these
	let layersAdded = $state(false);

	// ── Reactive: layer visibility ───────────────────────────────────────────
	// This $effect is at top-level so it fires every time layers[*].visible changes
	$effect(() => {
		const m = mapState.instance;
		if (!m || !layersAdded) return;
		layers.forEach((l) => {
			if (m.isStyleLoaded()) applyVisibility(m, l.id, l.visible);
		});
	});

	// ── Reactive: basemap change ──────────────────────────────────────────────
	$effect(() => {
		const basemapId = basemapState.current;
		const m = mapState.instance;
		if (!m) return;
		const bm = BASEMAPS.find((b) => b.id === basemapId);
		if (!bm) return;
		layersAdded = false;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		m.setStyle(bm.style as any);
		m.once('styledata', () => {
			addAllLayers(m);
		});
	});

	// ── Reactive: data source updates ────────────────────────────────────────
	$effect(() => {
		const m = mapState.instance;
		if (!m || !layersAdded || !m.isStyleLoaded()) return;
		void data.fires; // track
		const src = m.getSource('fire-hotspots') as GeoSource | undefined;
		src?.setData(firesToGeoJSON(data.fires));
	});

	$effect(() => {
		const m = mapState.instance;
		if (!m || !layersAdded || !m.isStyleLoaded()) return;
		void data.earthquakes;
		const src = m.getSource('earthquakes') as GeoSource | undefined;
		src?.setData(earthquakesToGeoJSON(data.earthquakes));
	});

	$effect(() => {
		const m = mapState.instance;
		if (!m || !layersAdded || !m.isStyleLoaded()) return;
		void data.healthFacilities;
		const src = m.getSource('health') as GeoSource | undefined;
		src?.setData(osmToGeoJSONPoints(data.healthFacilities));
	});

	$effect(() => {
		const m = mapState.instance;
		if (!m || !layersAdded || !m.isStyleLoaded()) return;
		void data.waterPoints;
		const src = m.getSource('water') as GeoSource | undefined;
		src?.setData(osmToGeoJSONPoints(data.waterPoints));
	});

	$effect(() => {
		const m = mapState.instance;
		if (!m || !layersAdded || !m.isStyleLoaded()) return;
		void data.drought; void data.fires;
		const src = m.getSource('risk-grid') as GeoSource | undefined;
		src?.setData(generateRiskGrid(data.fires.length, data.drought?.severity ?? 'severe'));
	});

	// ─────────────────────────────────────────────────────────────────────────

	type GeoSource = { setData: (d: GeoJSON.FeatureCollection) => void };

	function applyVisibility(m: Map, layerId: string, visible: boolean) {
		const visibility = visible ? 'visible' : 'none';
		const style = m.getStyle();
		if (!style?.layers) return;
		style.layers
			.filter((l) => l.id === layerId || l.id.startsWith(`${layerId}-`))
			.forEach((l) => {
				try { m.setLayoutProperty(l.id, 'visibility', visibility); } catch { /* ignore */ }
			});
	}

	async function addAllLayers(m: Map) {
		const { default: MapLibre } = await import('maplibre-gl');

		// 1. Risk grid
		if (!m.getSource('risk-grid')) {
			m.addSource('risk-grid', {
				type: 'geojson',
				data: generateRiskGrid(data.fires.length, data.drought?.severity ?? 'severe')
			});
		}
		if (!m.getLayer('risk-grid-fill')) {
			m.addLayer({
				id: 'risk-grid-fill',
				type: 'fill',
				source: 'risk-grid',
				paint: {
					'fill-color': [
						'interpolate', ['linear'], ['get', 'score'],
						0, '#22c55e', 30, '#eab308', 50, '#f97316', 70, '#ef4444', 90, '#8b0000'
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
			m.addSource('health', { type: 'geojson', data: osmToGeoJSONPoints(data.healthFacilities) });
		}
		if (!m.getLayer('health-points')) {
			m.addLayer({
				id: 'health-points',
				type: 'circle',
				source: 'health',
				paint: {
					'circle-radius': 6, 'circle-color': '#a855f7',
					'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5, 'circle-opacity': 0.9
				},
				layout: { visibility: 'none' }
			});
		}

		// 5. Water points
		if (!m.getSource('water')) {
			m.addSource('water', { type: 'geojson', data: osmToGeoJSONPoints(data.waterPoints) });
		}
		if (!m.getLayer('water-points')) {
			m.addLayer({
				id: 'water-points',
				type: 'circle',
				source: 'water',
				paint: {
					'circle-radius': 5, 'circle-color': '#06b6d4',
					'circle-stroke-color': '#fff', 'circle-stroke-width': 1.5, 'circle-opacity': 0.9
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
					'circle-radius': ['interpolate', ['linear'], ['get', 'frp'], 0, 5, 10, 7, 50, 12],
					'circle-color': ['match', ['get', 'confidence'], 'high', '#ef4444', 'nominal', '#f97316', '#fbbf24'],
					'circle-stroke-color': '#fff', 'circle-stroke-width': 1, 'circle-opacity': 0.85
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
					'circle-color': '#ec4899', 'circle-stroke-color': '#fff',
					'circle-stroke-width': 1, 'circle-opacity': 0.7
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
					'circle-radius': 10, 'circle-color': '#22c55e',
					'circle-stroke-color': '#fff', 'circle-stroke-width': 2, 'circle-opacity': 0.95
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
					'text-halo-color': basemapState.current === 'dark' || basemapState.current === 'satellite' ? '#0d1117' : '#ffffff',
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
					<div style="line-height:1.5">
						<div style="font-weight:600;color:#f97316;margin-bottom:4px">🔥 Fire Hotspot</div>
						<div>Brightness: <code>${props.brightness}K</code></div>
						<div>FRP: <code>${props.frp} MW</code></div>
						<div>Confidence: <code>${props.confidence}</code></div>
						<div>Detected: <code>${props.acq_date} ${props.acq_time}</code></div>
						<div>Satellite: <code>${props.satellite}</code></div>
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
					<div style="line-height:1.5">
						<div style="font-weight:600;color:#22c55e;margin-bottom:4px">🏕️ ${props.name}</div>
						<div>Established: <code>${props.established}</code></div>
						<div>Area: <code>${props.area_km2} km²</code></div>
						<div style="font-size:11px;color:#9ca3af;margin-top:4px">${props.description}</div>
					</div>
				`)
				.addTo(m);
		});

		m.on('mouseenter', 'fire-hotspots', () => { m.getCanvas().style.cursor = 'pointer'; });
		m.on('mouseleave', 'fire-hotspots', () => { m.getCanvas().style.cursor = ''; });
		m.on('mouseenter', 'camps', () => { m.getCanvas().style.cursor = 'pointer'; });
		m.on('mouseleave', 'camps', () => { m.getCanvas().style.cursor = ''; });

		layersAdded = true;

		// Apply stored visibility state
		layers.forEach((l) => applyVisibility(m, l.id, l.visible));
	}

	onMount(async () => {
		const MapLibre = await import('maplibre-gl');
		const initialBm = BASEMAPS.find((b) => b.id === basemapState.current) ?? BASEMAPS[0];

		const m = new MapLibre.Map({
			container: mapContainer,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			style: initialBm.style as any,
			center: [40.35, 1.68],
			zoom: 9,
			minZoom: 6,
			maxZoom: 16,
			attributionControl: false
		});

		// Setting mapState.instance triggers the top-level $effects
		mapState.instance = m;

		m.on('load', () => {
			addAllLayers(m);
		});
	});

	onDestroy(() => {
		popup?.remove();
		mapState.instance?.remove();
		mapState.instance = null;
	});
</script>

<div
	bind:this={mapContainer}
	class="h-full w-full"
	role="region"
	aria-label="Dadaab climate risk map"
></div>
