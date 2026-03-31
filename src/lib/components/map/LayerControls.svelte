<script lang="ts">
	import { layers } from '$lib/stores/layerStore.svelte';
	import { data } from '$lib/stores/dataStore.svelte';
	import { mapState } from '$lib/stores/mapStore.svelte';
	import { basemapState, BASEMAPS } from '$lib/stores/basemapStore.svelte';
	import { openTable } from '$lib/stores/attributeTableStore.svelte';
	import { zoomToLayer } from '$lib/utils/layerBounds';
	import { Map as MapIcon, Layers, ZoomIn, Table2 } from 'lucide-svelte';

	// Layers that have an attribute table
	const TABLE_LAYERS = new Set(['fire-hotspots', 'camps', 'earthquakes', 'health', 'water', 'drought-zones', 'flood-zones']);

	function applyVisibility(layerId: string, visible: boolean) {
		const m = mapState.instance;
		if (!m || !m.isStyleLoaded()) return;
		const visibility = visible ? 'visible' : 'none';
		const style = m.getStyle();
		if (!style?.layers) return;
		style.layers
			.filter((l) => l.id === layerId || l.id.startsWith(`${layerId}-`))
			.forEach((l) => {
				try { m.setLayoutProperty(l.id, 'visibility', visibility); } catch { /* ignore */ }
			});
	}

	function toggleLayer(id: string) {
		const layer = layers.find((l) => l.id === id);
		if (!layer) return;
		layer.visible = !layer.visible;
		applyVisibility(id, layer.visible);
	}

	function handleZoom(id: string) {
		if (!mapState.instance) return;
		zoomToLayer(mapState.instance, id);
	}

	function switchBasemap(id: string) {
		basemapState.current = id;
	}

	function getCount(id: string): number | undefined {
		switch (id) {
			case 'fire-hotspots': return data.fires.length;
			case 'earthquakes': return data.earthquakes.length;
			case 'health': return data.healthFacilities.filter((f) => f.lat).length;
			case 'water': return data.waterPoints.filter((f) => f.lat).length;
			case 'camps': return 5;
			default: return undefined;
		}
	}
</script>

<!-- Basemap switcher -->
<div class="mb-3">
	<div class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
		<MapIcon size={10} />
		<span>Basemap</span>
	</div>
	<div class="grid grid-cols-4 gap-1">
		{#each BASEMAPS as bm}
			<button
				onclick={() => switchBasemap(bm.id)}
				class="flex flex-col items-center gap-1 rounded p-1 text-center transition-all"
				class:ring-1={basemapState.current === bm.id}
				class:ring-foreground={basemapState.current === bm.id}
				class:bg-muted={basemapState.current === bm.id}
				aria-label="Switch to {bm.label} basemap"
				aria-pressed={basemapState.current === bm.id}
			>
				<div class="h-7 w-full rounded-sm border border-border" style="background-color: {bm.preview}"></div>
				<span class="text-[9px] leading-tight text-muted-foreground">{bm.label}</span>
			</button>
		{/each}
	</div>
</div>

<div class="border-t border-border mb-3"></div>

<!-- Layer toggles -->
<div class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
	<Layers size={10} />
	<span>Map Layers</span>
</div>
<div class="space-y-0.5">
	{#each layers as layer (layer.id)}
		<div class="group rounded p-1.5 transition-colors hover:bg-muted/50">
			<!-- Top row: checkbox + label + count + actions -->
			<div class="flex items-center gap-2">
				<!-- Checkbox -->
				<button
					class="flex shrink-0 items-center gap-2 min-w-0 flex-1"
					onclick={() => toggleLayer(layer.id)}
					aria-label="Toggle {layer.label}"
					aria-pressed={layer.visible}
				>
					<div
						class="mt-0 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors"
						style="border-color: {layer.color}; background-color: {layer.visible ? layer.color : 'transparent'}"
					>
						{#if layer.visible}
							<svg width="10" height="8" viewBox="0 0 10 8" fill="none">
								<path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						{/if}
					</div>
					<span
						class="text-xs font-medium leading-tight transition-colors truncate"
						class:text-foreground={layer.visible}
						class:text-muted-foreground={!layer.visible}
					>
						{layer.label}
					</span>
					{#if getCount(layer.id) !== undefined}
						<span
							class="shrink-0 rounded-full px-1.5 font-mono text-[10px]"
							style="background-color: {layer.color}22; color: {layer.color}"
						>
							{getCount(layer.id)}
						</span>
					{/if}
				</button>

				<!-- Action buttons — always visible, not just on hover -->
				<div class="flex shrink-0 items-center gap-0.5">
					<!-- Zoom to layer -->
					<button
						onclick={() => handleZoom(layer.id)}
						class="flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-muted hover:text-foreground"
						title="Zoom to {layer.label}"
						aria-label="Zoom to {layer.label}"
					>
						<ZoomIn size={12} />
					</button>
					<!-- Attribute table -->
					{#if TABLE_LAYERS.has(layer.id)}
						<button
							onclick={() => openTable(layer.id)}
							class="flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-muted hover:text-foreground"
							title="Open attribute table"
							aria-label="Open attribute table for {layer.label}"
						>
							<Table2 size={12} />
						</button>
					{/if}
				</div>
			</div>
			<!-- Description -->
			<div class="mt-0.5 pl-6 text-[10px] leading-tight text-muted-foreground/60">{layer.description}</div>
		</div>
	{/each}
</div>
