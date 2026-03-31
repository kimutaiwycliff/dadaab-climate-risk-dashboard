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
	let popup: Popup | null = null;      // click popup — stays until dismissed
	let hoverPopup: Popup | null = null; // hover tooltip — follows cursor, auto-dismisses
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
	// IMPORTANT: data reads must come BEFORE the early-return guard so Svelte
	// always registers the reactive dependency, even on the first run when
	// layersAdded is still false. Without this, when data arrives later the
	// effect never re-fires because the dependency was never tracked.
	$effect(() => {
		const fires = data.fires; // read BEFORE early return
		const m = mapState.instance;
		if (!m || !layersAdded || !m.isStyleLoaded()) return;
		const src = m.getSource('fire-hotspots') as GeoSource | undefined;
		src?.setData(firesToGeoJSON(fires));
	});

	$effect(() => {
		const earthquakes = data.earthquakes; // read BEFORE early return
		const m = mapState.instance;
		if (!m || !layersAdded || !m.isStyleLoaded()) return;
		const src = m.getSource('earthquakes') as GeoSource | undefined;
		src?.setData(earthquakesToGeoJSON(earthquakes));
	});

	$effect(() => {
		const healthFacilities = data.healthFacilities; // read BEFORE early return
		const m = mapState.instance;
		if (!m || !layersAdded || !m.isStyleLoaded()) return;
		const src = m.getSource('health') as GeoSource | undefined;
		src?.setData(osmToGeoJSONPoints(healthFacilities));
	});

	$effect(() => {
		const waterPoints = data.waterPoints; // read BEFORE early return
		const m = mapState.instance;
		if (!m || !layersAdded || !m.isStyleLoaded()) return;
		const src = m.getSource('water') as GeoSource | undefined;
		src?.setData(osmToGeoJSONPoints(waterPoints));
	});

	$effect(() => {
		const fires = data.fires;   // read BEFORE early return
		const drought = data.drought; // read BEFORE early return
		const m = mapState.instance;
		if (!m || !layersAdded || !m.isStyleLoaded()) return;
		const src = m.getSource('risk-grid') as GeoSource | undefined;
		src?.setData(generateRiskGrid(fires.length, drought?.severity ?? 'severe'));
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

		// ── Helper: show hover tooltip ──────────────────────────────────────────
		function showHover(lngLat: [number, number], html: string) {
			hoverPopup?.remove();
			hoverPopup = new MapLibre.Popup({
				closeButton: false,
				closeOnClick: false,
				maxWidth: '220px',
				className: 'hover-popup'
			})
				.setLngLat(lngLat)
				.setHTML(html)
				.addTo(m);
		}
		function hideHover() {
			hoverPopup?.remove();
			hoverPopup = null;
		}
		function setCursor(c: string) { m.getCanvas().style.cursor = c; }

		// ── Click popups (persistent, dismissible) ───────────────────────────
		m.on('click', 'fire-hotspots', (e) => {
			if (!e.features?.[0]) return;
			hideHover();
			const props = e.features[0].properties as Record<string, string | number>;
			const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];
			popup?.remove();
			popup = new MapLibre.Popup({ closeButton: true, maxWidth: '270px' })
				.setLngLat(coords)
				.setHTML(`
					<div style="line-height:1.6">
						<div style="font-weight:600;color:#f97316;margin-bottom:6px">🔥 Fire Hotspot</div>
						<table style="width:100%;font-size:11px;border-collapse:collapse">
							<tr><td style="color:#9ca3af;padding:1px 6px 1px 0">Brightness</td><td><code>${props.brightness}K</code></td></tr>
							<tr><td style="color:#9ca3af;padding:1px 6px 1px 0">FRP</td><td><code>${props.frp} MW</code></td></tr>
							<tr><td style="color:#9ca3af;padding:1px 6px 1px 0">Confidence</td><td><code>${props.confidence}</code></td></tr>
							<tr><td style="color:#9ca3af;padding:1px 6px 1px 0">Detected</td><td><code>${props.acq_date} ${props.acq_time}</code></td></tr>
							<tr><td style="color:#9ca3af;padding:1px 6px 1px 0">Satellite</td><td><code>${props.satellite}</code></td></tr>
							<tr><td style="color:#9ca3af;padding:1px 6px 1px 0">Day/Night</td><td><code>${props.daynight === 'D' ? '☀️ Day' : '🌙 Night'}</code></td></tr>
						</table>
					</div>
				`)
				.addTo(m);
		});

		m.on('click', 'camps', (e) => {
			if (!e.features?.[0]) return;
			hideHover();
			const props = e.features[0].properties as Record<string, string | number>;
			const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];
			popup?.remove();
			popup = new MapLibre.Popup({ closeButton: true, maxWidth: '290px' })
				.setLngLat(coords)
				.setHTML(`
					<div style="line-height:1.6">
						<div style="font-weight:600;color:#22c55e;margin-bottom:6px">🏕️ ${props.name}</div>
						<table style="width:100%;font-size:11px;border-collapse:collapse">
							<tr><td style="color:#9ca3af;padding:1px 6px 1px 0">Established</td><td><code>${props.established}</code></td></tr>
							<tr><td style="color:#9ca3af;padding:1px 6px 1px 0">Area</td><td><code>${props.area_km2} km²</code></td></tr>
						</table>
						<div style="font-size:11px;color:#9ca3af;margin-top:6px;line-height:1.4">${props.description}</div>
					</div>
				`)
				.addTo(m);
		});

		m.on('click', 'earthquakes-circles', (e) => {
			if (!e.features?.[0]) return;
			hideHover();
			const props = e.features[0].properties as Record<string, string | number>;
			const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];
			popup?.remove();
			const timeStr = props.time ? new Date(Number(props.time)).toUTCString() : '—';
			popup = new MapLibre.Popup({ closeButton: true, maxWidth: '280px' })
				.setLngLat(coords)
				.setHTML(`
					<div style="line-height:1.6">
						<div style="font-weight:600;color:#ec4899;margin-bottom:6px">🌍 Earthquake M${Number(props.magnitude).toFixed(1)}</div>
						<table style="width:100%;font-size:11px;border-collapse:collapse">
							<tr><td style="color:#9ca3af;padding:1px 6px 1px 0">Location</td><td style="font-size:10px">${props.place}</td></tr>
							<tr><td style="color:#9ca3af;padding:1px 6px 1px 0">Depth</td><td><code>${Number(props.depth).toFixed(1)} km</code></td></tr>
							<tr><td style="color:#9ca3af;padding:1px 6px 1px 0">Time</td><td style="font-size:10px">${timeStr}</td></tr>
						</table>
					</div>
				`)
				.addTo(m);
		});

		m.on('click', 'health-points', (e) => {
			if (!e.features?.[0]) return;
			hideHover();
			const props = e.features[0].properties as Record<string, string>;
			const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];
			popup?.remove();
			popup = new MapLibre.Popup({ closeButton: true, maxWidth: '240px' })
				.setLngLat(coords)
				.setHTML(`
					<div style="line-height:1.6">
						<div style="font-weight:600;color:#a855f7;margin-bottom:4px">🏥 ${props.name || props['name:en'] || 'Health Facility'}</div>
						<div style="font-size:11px;color:#9ca3af">${props.amenity || 'Health centre'}</div>
					</div>
				`)
				.addTo(m);
		});

		m.on('click', 'water-points', (e) => {
			if (!e.features?.[0]) return;
			hideHover();
			const props = e.features[0].properties as Record<string, string>;
			const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];
			popup?.remove();
			popup = new MapLibre.Popup({ closeButton: true, maxWidth: '220px' })
				.setLngLat(coords)
				.setHTML(`
					<div style="line-height:1.6">
						<div style="font-weight:600;color:#06b6d4;margin-bottom:4px">💧 ${props.name || 'Water Point'}</div>
						<div style="font-size:11px;color:#9ca3af">${props.amenity || props['man_made'] || 'Water source'}</div>
					</div>
				`)
				.addTo(m);
		});

		// ── Hover tooltips (quick info on mouseover) ─────────────────────────
		m.on('mousemove', 'fire-hotspots', (e) => {
			if (!e.features?.[0]) return;
			setCursor('pointer');
			const props = e.features[0].properties as Record<string, string | number>;
			showHover(
				[e.lngLat.lng, e.lngLat.lat],
				`<div style="font-size:11px"><strong style="color:#f97316">🔥 Fire</strong> &nbsp; FRP: <code>${props.frp} MW</code> &nbsp; Confidence: <code>${props.confidence}</code></div>`
			);
		});
		m.on('mouseleave', 'fire-hotspots', () => { setCursor(''); hideHover(); });

		m.on('mousemove', 'camps', (e) => {
			if (!e.features?.[0]) return;
			setCursor('pointer');
			const props = e.features[0].properties as Record<string, string | number>;
			showHover(
				[e.lngLat.lng, e.lngLat.lat],
				`<div style="font-size:11px"><strong style="color:#22c55e">🏕️ ${props.name}</strong> &nbsp; Est. <code>${props.established}</code> &nbsp; ${props.area_km2} km²</div>`
			);
		});
		m.on('mouseleave', 'camps', () => { setCursor(''); hideHover(); });

		m.on('mousemove', 'earthquakes-circles', (e) => {
			if (!e.features?.[0]) return;
			setCursor('pointer');
			const props = e.features[0].properties as Record<string, string | number>;
			showHover(
				[e.lngLat.lng, e.lngLat.lat],
				`<div style="font-size:11px"><strong style="color:#ec4899">🌍 M${Number(props.magnitude).toFixed(1)}</strong> &nbsp; Depth: <code>${Number(props.depth).toFixed(0)} km</code></div>`
			);
		});
		m.on('mouseleave', 'earthquakes-circles', () => { setCursor(''); hideHover(); });

		m.on('mousemove', 'health-points', (e) => {
			if (!e.features?.[0]) return;
			setCursor('pointer');
			const props = e.features[0].properties as Record<string, string>;
			showHover(
				[e.lngLat.lng, e.lngLat.lat],
				`<div style="font-size:11px"><strong style="color:#a855f7">🏥</strong> ${props.name || props.amenity || 'Health facility'}</div>`
			);
		});
		m.on('mouseleave', 'health-points', () => { setCursor(''); hideHover(); });

		m.on('mousemove', 'water-points', (e) => {
			if (!e.features?.[0]) return;
			setCursor('pointer');
			const props = e.features[0].properties as Record<string, string>;
			showHover(
				[e.lngLat.lng, e.lngLat.lat],
				`<div style="font-size:11px"><strong style="color:#06b6d4">💧</strong> ${props.name || props.amenity || 'Water point'}</div>`
			);
		});
		m.on('mouseleave', 'water-points', () => { setCursor(''); hideHover(); });

		// ── Flood zone click + hover ─────────────────────────────────────────
		m.on('click', 'flood-zones-fill', (e) => {
			if (!e.features?.[0]) return;
			hideHover();
			const props = e.features[0].properties as Record<string, string | number>;
			popup?.remove();
			popup = new MapLibre.Popup({ closeButton: true, maxWidth: '260px' })
				.setLngLat(e.lngLat)
				.setHTML(`
					<div style="line-height:1.6">
						<div style="font-weight:600;color:#3b82f6;margin-bottom:6px">🌊 ${props.name || 'Flood-Prone Zone'}</div>
						<div style="font-size:11px;color:#9ca3af">${props.description || 'Seasonal flood risk area in the Dadaab region'}</div>
						${props.risk ? `<div style="font-size:11px;margin-top:4px">Risk: <code>${props.risk}</code></div>` : ''}
					</div>
				`)
				.addTo(m);
		});
		m.on('mousemove', 'flood-zones-fill', (e) => {
			setCursor('pointer');
			const props = e.features?.[0]?.properties as Record<string, string> | undefined;
			showHover(
				[e.lngLat.lng, e.lngLat.lat],
				`<div style="font-size:11px"><strong style="color:#3b82f6">🌊 Flood Zone</strong>${props?.name ? ` — ${props.name}` : ''}</div>`
			);
		});
		m.on('mouseleave', 'flood-zones-fill', () => { setCursor(''); hideHover(); });

		// ── Drought zone click + hover ───────────────────────────────────────
		m.on('click', 'drought-zones-fill', (e) => {
			if (!e.features?.[0]) return;
			hideHover();
			const props = e.features[0].properties as Record<string, string | number>;
			popup?.remove();
			popup = new MapLibre.Popup({ closeButton: true, maxWidth: '260px' })
				.setLngLat(e.lngLat)
				.setHTML(`
					<div style="line-height:1.6">
						<div style="font-weight:600;color:#f59e0b;margin-bottom:6px">🏜️ ${props.name || 'Drought Zone'}</div>
						<div style="font-size:11px;color:#9ca3af">${props.description || 'Drought-affected area'}</div>
						${props.severity ? `<div style="font-size:11px;margin-top:4px">Severity: <code>${props.severity}</code></div>` : ''}
					</div>
				`)
				.addTo(m);
		});
		m.on('mousemove', 'drought-zones-fill', (e) => {
			setCursor('pointer');
			const props = e.features?.[0]?.properties as Record<string, string> | undefined;
			showHover(
				[e.lngLat.lng, e.lngLat.lat],
				`<div style="font-size:11px"><strong style="color:#f59e0b">🏜️ Drought Zone</strong>${props?.name ? ` — ${props.name}` : ''}</div>`
			);
		});
		m.on('mouseleave', 'drought-zones-fill', () => { setCursor(''); hideHover(); });

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
		hoverPopup?.remove();
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
