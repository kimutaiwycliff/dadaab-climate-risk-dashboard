<script lang="ts">
	import { attrTable, closeTable } from '$lib/stores/attributeTableStore.svelte';
	import { data } from '$lib/stores/dataStore.svelte';
	import { mapState } from '$lib/stores/mapStore.svelte';
	import { DADAAB_CAMPS, DROUGHT_ZONES, FLOOD_ZONES } from '$lib/data/camps';
	import { timeAgo } from '$lib/utils/dateUtils';
	import { X, ArrowUpDown, ArrowUp, ArrowDown, Search, ZoomIn } from 'lucide-svelte';

	// ── Column definition ─────────────────────────────────────────────────────
	interface Column {
		key: string;
		label: string;
		type?: 'number' | 'string' | 'date';
		fmt?: (v: unknown) => string;
	}

	interface Row {
		id: string | number;
		lngLat?: [number, number];
		[key: string]: unknown;
	}

	// ── Layer data registry ───────────────────────────────────────────────────
	function getLayerData(layerId: string): { columns: Column[]; rows: Row[] } {
		switch (layerId) {
			case 'fire-hotspots':
				return {
					columns: [
						{ key: 'acq_date', label: 'Date', type: 'string' },
						{ key: 'acq_time', label: 'Time', type: 'string' },
						{ key: 'latitude', label: 'Latitude', type: 'number', fmt: (v) => Number(v).toFixed(4) },
						{ key: 'longitude', label: 'Longitude', type: 'number', fmt: (v) => Number(v).toFixed(4) },
						{ key: 'brightness', label: 'Brightness (K)', type: 'number', fmt: (v) => Number(v).toFixed(1) },
						{ key: 'frp', label: 'FRP (MW)', type: 'number', fmt: (v) => Number(v).toFixed(1) },
						{ key: 'confidence', label: 'Confidence', type: 'string' },
						{ key: 'satellite', label: 'Satellite', type: 'string' },
						{ key: 'daynight', label: 'Day/Night', type: 'string', fmt: (v) => v === 'D' ? 'Day' : 'Night' }
					],
					rows: data.fires.map((f, i) => ({
						id: i,
						lngLat: [f.longitude, f.latitude],
						acq_date: f.acq_date,
						acq_time: f.acq_time,
						latitude: f.latitude,
						longitude: f.longitude,
						brightness: f.brightness,
						frp: f.frp,
						confidence: f.confidence,
						satellite: f.satellite,
						daynight: f.daynight
					}))
				};

			case 'camps':
				return {
					columns: [
						{ key: 'name', label: 'Camp Name', type: 'string' },
						{ key: 'established', label: 'Established', type: 'number' },
						{ key: 'area_km2', label: 'Area (km²)', type: 'number' },
						{ key: 'lat', label: 'Latitude', type: 'number', fmt: (v) => Number(v).toFixed(4) },
						{ key: 'lng', label: 'Longitude', type: 'number', fmt: (v) => Number(v).toFixed(4) },
						{ key: 'description', label: 'Description', type: 'string' }
					],
					rows: DADAAB_CAMPS.map((c) => ({
						id: c.id,
						lngLat: [c.lng, c.lat],
						name: c.name,
						established: c.established,
						area_km2: c.area_km2,
						lat: c.lat,
						lng: c.lng,
						description: c.description
					}))
				};

			case 'earthquakes':
				return {
					columns: [
						{ key: 'magnitude', label: 'Magnitude', type: 'number', fmt: (v) => `M${Number(v).toFixed(1)}` },
						{ key: 'depth', label: 'Depth (km)', type: 'number', fmt: (v) => Number(v).toFixed(1) },
						{ key: 'place', label: 'Location', type: 'string' },
						{ key: 'latitude', label: 'Latitude', type: 'number', fmt: (v) => Number(v).toFixed(4) },
						{ key: 'longitude', label: 'Longitude', type: 'number', fmt: (v) => Number(v).toFixed(4) },
						{ key: 'time', label: 'Time', type: 'date', fmt: (v) => timeAgo(Number(v)) },
						{ key: 'time_abs', label: 'Date (UTC)', type: 'string', fmt: (v) => new Date(Number(v)).toUTCString().slice(0, 22) }
					],
					rows: data.earthquakes.map((e) => ({
						id: e.id,
						lngLat: [e.longitude, e.latitude],
						magnitude: e.magnitude,
						depth: e.depth,
						place: e.place,
						latitude: e.latitude,
						longitude: e.longitude,
						time: e.time,
						time_abs: e.time
					}))
				};

			case 'health':
				return {
					columns: [
						{ key: 'name', label: 'Name', type: 'string' },
						{ key: 'amenity', label: 'Type', type: 'string' },
						{ key: 'operator', label: 'Operator', type: 'string' },
						{ key: 'latitude', label: 'Latitude', type: 'number', fmt: (v) => Number(v).toFixed(4) },
						{ key: 'longitude', label: 'Longitude', type: 'number', fmt: (v) => Number(v).toFixed(4) }
					],
					rows: data.healthFacilities
						.filter((f) => f.lat != null && f.lon != null)
						.map((f) => ({
							id: f.id,
							lngLat: [f.lon!, f.lat!] as [number, number],
							name: f.tags.name || f.tags['name:en'] || '—',
							amenity: f.tags.amenity || '—',
							operator: f.tags.operator || '—',
							latitude: f.lat,
							longitude: f.lon
						}))
				};

			case 'water':
				return {
					columns: [
						{ key: 'name', label: 'Name', type: 'string' },
						{ key: 'type', label: 'Type', type: 'string' },
						{ key: 'access', label: 'Access', type: 'string' },
						{ key: 'latitude', label: 'Latitude', type: 'number', fmt: (v) => Number(v).toFixed(4) },
						{ key: 'longitude', label: 'Longitude', type: 'number', fmt: (v) => Number(v).toFixed(4) }
					],
					rows: data.waterPoints
						.filter((f) => f.lat != null && f.lon != null)
						.map((f) => ({
							id: f.id,
							lngLat: [f.lon!, f.lat!] as [number, number],
							name: f.tags.name || '—',
							type: f.tags.amenity || f.tags.man_made || '—',
							access: f.tags.access || '—',
							latitude: f.lat,
							longitude: f.lon
						}))
				};

			case 'drought-zones':
				return {
					columns: [
						{ key: 'label', label: 'IPC Phase', type: 'string' },
						{ key: 'description', label: 'Description', type: 'string' }
					],
					rows: DROUGHT_ZONES.map((z) => ({
						id: z.id,
						label: z.label,
						description: z.description
					}))
				};

			case 'flood-zones':
				return {
					columns: [
						{ key: 'label', label: 'Feature Name', type: 'string' },
						{ key: 'vertices', label: 'Vertices', type: 'number' }
					],
					rows: FLOOD_ZONES.map((z) => ({
						id: z.id,
						label: z.label,
						vertices: z.coordinates.length
					}))
				};

			default:
				return { columns: [], rows: [] };
		}
	}

	// ── State ─────────────────────────────────────────────────────────────────
	let search = $state('');
	let sortKey = $state<string | null>(null);
	let sortDir = $state<'asc' | 'desc'>('asc');
	let selectedRowId = $state<string | number | null>(null);
	let panelHeight = $state(38); // vh

	let layerData = $derived(attrTable.layerId ? getLayerData(attrTable.layerId) : { columns: [], rows: [] });

	let filteredRows = $derived(() => {
		let rows = layerData.rows;
		if (search.trim()) {
			const q = search.toLowerCase();
			rows = rows.filter((r) =>
				layerData.columns.some((c) => String(r[c.key] ?? '').toLowerCase().includes(q))
			);
		}
		if (sortKey) {
			const col = layerData.columns.find((c) => c.key === sortKey);
			rows = [...rows].sort((a, b) => {
				const av = a[sortKey!];
				const bv = b[sortKey!];
				let cmp = 0;
				if (col?.type === 'number' || col?.type === 'date') {
					cmp = Number(av) - Number(bv);
				} else {
					cmp = String(av ?? '').localeCompare(String(bv ?? ''));
				}
				return sortDir === 'asc' ? cmp : -cmp;
			});
		}
		return rows;
	});

	function toggleSort(key: string) {
		if (sortKey === key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = key;
			sortDir = 'asc';
		}
	}

	function zoomToRow(row: Row) {
		if (!row.lngLat || !mapState.instance) return;
		selectedRowId = row.id;
		mapState.instance.flyTo({ center: row.lngLat, zoom: 12, duration: 600 });
	}

	function layerLabel(id: string): string {
		const labels: Record<string, string> = {
			'fire-hotspots': 'Fire Hotspots (FIRMS)',
			'camps': 'Camp Settlements',
			'earthquakes': 'Seismic Events',
			'health': 'Health Facilities',
			'water': 'Water Points',
			'drought-zones': 'Drought Zones',
			'flood-zones': 'Flood-Prone Areas'
		};
		return labels[id] ?? id;
	}

	// Drag-to-resize panel
	let dragging = false;
	let startY = 0;
	let startH = 0;

	function onDragStart(e: MouseEvent | TouchEvent) {
		dragging = true;
		startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
		startH = panelHeight;
		e.preventDefault();
	}

	function onDragMove(e: MouseEvent | TouchEvent) {
		if (!dragging) return;
		const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
		const delta = ((startY - y) / window.innerHeight) * 100;
		panelHeight = Math.max(20, Math.min(75, startH + delta));
	}

	function onDragEnd() { dragging = false; }
</script>

<svelte:window
	onmousemove={onDragMove}
	onmouseup={onDragEnd}
	ontouchmove={onDragMove}
	ontouchend={onDragEnd}
/>

{#if attrTable.open && attrTable.layerId}
	<!-- Backdrop (just a faint bottom shadow, no full-screen block) -->
	<div
		class="absolute bottom-0 left-0 right-0 z-20 flex flex-col border-t border-border bg-background shadow-2xl"
		style="height: {panelHeight}vh"
	>
		<!-- Drag handle + header ─────────────────────────────────────────────── -->
		<div
			class="flex shrink-0 cursor-row-resize select-none items-center justify-between border-b border-border px-3 py-2"
			onmousedown={onDragStart}
			ontouchstart={onDragStart}
			role="slider"
			aria-label="Resize attribute table"
			aria-valuenow={panelHeight}
			aria-valuemin={20}
			aria-valuemax={75}
			tabindex="0"
		>
			<div class="flex items-center gap-2">
				<!-- Drag grip -->
				<div class="flex flex-col gap-0.5 opacity-40">
					<div class="h-0.5 w-5 rounded bg-foreground"></div>
					<div class="h-0.5 w-5 rounded bg-foreground"></div>
					<div class="h-0.5 w-5 rounded bg-foreground"></div>
				</div>
				<span class="text-xs font-semibold text-foreground">
					Attribute Table — {layerLabel(attrTable.layerId)}
				</span>
				<span class="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
					{filteredRows().length} / {layerData.rows.length} features
				</span>
			</div>
			<div class="flex items-center gap-1.5">
				<!-- Search -->
				<div class="relative hidden sm:block">
					<Search size={11} class="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
					<input
						type="search"
						placeholder="Search features…"
						bind:value={search}
						class="h-6 w-44 rounded border border-border bg-muted pl-6 pr-2 font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
					/>
				</div>
				<button
					onclick={closeTable}
					class="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
					aria-label="Close attribute table"
				>
					<X size={13} />
				</button>
			</div>
		</div>

		<!-- Mobile search -->
		<div class="shrink-0 border-b border-border px-3 py-1.5 sm:hidden">
			<div class="relative">
				<Search size={11} class="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
				<input
					type="search"
					placeholder="Search features…"
					bind:value={search}
					class="h-7 w-full rounded border border-border bg-muted pl-6 pr-2 font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
				/>
			</div>
		</div>

		<!-- Table ──────────────────────────────────────────────────────────────── -->
		<div class="min-h-0 flex-1 overflow-auto">
			{#if layerData.columns.length === 0}
				<div class="flex items-center justify-center h-full text-sm text-muted-foreground">
					No attribute data available for this layer.
				</div>
			{:else}
				<table class="w-full min-w-max border-collapse text-xs">
					<thead class="sticky top-0 z-10 bg-card">
						<tr>
							<!-- Row actions column -->
							<th class="w-8 border-b border-border px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
								#
							</th>
							{#each layerData.columns as col}
								<th
									class="cursor-pointer select-none border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted hover:text-foreground transition-colors whitespace-nowrap"
									onclick={() => toggleSort(col.key)}
									aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
								>
									<span class="flex items-center gap-1">
										{col.label}
										{#if sortKey === col.key}
											{#if sortDir === 'asc'}
												<ArrowUp size={9} class="text-foreground" />
											{:else}
												<ArrowDown size={9} class="text-foreground" />
											{/if}
										{:else}
											<ArrowUpDown size={9} class="opacity-30" />
										{/if}
									</span>
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each filteredRows() as row, i}
							<tr
								class="group cursor-pointer border-b border-border transition-colors hover:bg-muted/50"
								class:bg-muted={selectedRowId === row.id}
								onclick={() => zoomToRow(row)}
								aria-selected={selectedRowId === row.id}
								title="Click to zoom to feature"
							>
								<!-- Row number + zoom icon -->
								<td class="border-r border-border px-2 py-1 text-center font-mono text-[10px] text-muted-foreground">
									<span class="group-hover:hidden">{i + 1}</span>
									<ZoomIn size={11} class="mx-auto hidden text-foreground group-hover:block" />
								</td>
								{#each layerData.columns as col}
									{@const raw = row[col.key]}
									{@const val = col.fmt ? col.fmt(raw) : String(raw ?? '—')}
									<td
										class="px-3 py-1 font-mono text-[11px] text-foreground whitespace-nowrap max-w-[240px] overflow-hidden text-ellipsis"
										title={val}
									>
										<!-- Confidence color badge -->
										{#if col.key === 'confidence'}
											<span class="rounded-sm px-1.5 py-0.5 text-[10px] font-semibold"
												style="
													background-color: {raw === 'high' ? '#ef444430' : raw === 'nominal' ? '#f9731630' : '#fbbf2430'};
													color: {raw === 'high' ? '#ef4444' : raw === 'nominal' ? '#f97316' : '#fbbf24'}
												"
											>{val}</span>
										<!-- Magnitude color -->
										{:else if col.key === 'magnitude'}
											<span class="font-bold" style="color: {Number(raw) >= 5 ? '#ef4444' : Number(raw) >= 3.5 ? '#f97316' : '#eab308'}">{val}</span>
										{:else}
											{val}
										{/if}
									</td>
								{/each}
							</tr>
						{:else}
							<tr>
								<td colspan={layerData.columns.length + 1} class="py-8 text-center text-xs text-muted-foreground">
									No features match your search.
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>

		<!-- Footer ─────────────────────────────────────────────────────────────── -->
		<div class="flex shrink-0 items-center justify-between border-t border-border bg-card px-3 py-1">
			<span class="font-mono text-[10px] text-muted-foreground">
				{#if selectedRowId !== null}
					Feature selected — click another row or the map to deselect
				{:else}
					Click any row to zoom to feature on map
				{/if}
			</span>
			{#if search}
				<button
					class="text-[10px] text-muted-foreground hover:text-foreground"
					onclick={() => { search = ''; }}
				>
					Clear filter
				</button>
			{/if}
		</div>
	</div>
{/if}
