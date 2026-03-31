<script lang="ts">
	import { layers } from '$lib/stores/layerStore.svelte';
	import { data } from '$lib/stores/dataStore.svelte';
	import { mapState } from '$lib/stores/mapStore.svelte';
	import { basemapState, BASEMAPS } from '$lib/stores/basemapStore.svelte';
	import { openTable } from '$lib/stores/attributeTableStore.svelte';
	import { zoomToLayer } from '$lib/utils/layerBounds';
	import { Map as MapIcon, Layers, ZoomIn, Table2, GripVertical } from 'lucide-svelte';

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

	// ── Drag-to-reorder ────────────────────────────────────────────────────────
	let dragFromIdx = $state<number | null>(null);
	let dragOverIdx = $state<number | null>(null);

	function onDragStart(e: DragEvent, idx: number) {
		dragFromIdx = idx;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', String(idx));
		}
	}

	function onDragOver(e: DragEvent, idx: number) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dragOverIdx = idx;
	}

	function onDragLeave(idx: number) {
		if (dragOverIdx === idx) dragOverIdx = null;
	}

	function onDrop(e: DragEvent, toIdx: number) {
		e.preventDefault();
		if (dragFromIdx === null || dragFromIdx === toIdx) {
			dragFromIdx = null;
			dragOverIdx = null;
			return;
		}
		// Reorder the reactive layers array
		const [moved] = layers.splice(dragFromIdx, 1);
		layers.splice(toIdx, 0, moved);
		dragFromIdx = null;
		dragOverIdx = null;
		syncLayerOrder();
	}

	function onDragEnd() {
		dragFromIdx = null;
		dragOverIdx = null;
	}

	// Re-apply z-order in MapLibre after reordering.
	// Process layers[0] → layers[N-1], moving each group to the absolute top.
	// The last group processed ends up on top of the map (layers[N-1] = top).
	function syncLayerOrder() {
		const m = mapState.instance;
		if (!m || !m.isStyleLoaded()) return;
		const style = m.getStyle();
		if (!style?.layers) return;
		for (const layer of layers) {
			const sublayerIds = style.layers
				.filter((l) => l.id === layer.id || l.id.startsWith(`${layer.id}-`))
				.map((l) => l.id);
			for (const id of sublayerIds) {
				try { m.moveLayer(id); } catch { /* ignore */ }
			}
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
<div class="mb-1.5 flex items-center justify-between">
	<div class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
		<Layers size={10} />
		<span>Map Layers</span>
	</div>
	<span class="text-[9px] text-muted-foreground/50 italic">drag to reorder</span>
</div>

<!-- Hint: top of list = top of map (QGIS convention, reversed from store order) -->
<div class="mb-1 flex items-center justify-between px-1 text-[9px] text-muted-foreground/40">
	<span>↑ drawn on top</span>
	<span>drawn below ↓</span>
</div>

<div class="space-y-0.5">
	{#each [...layers].reverse() as layer, di (layer.id)}
		{@const ri = layers.length - 1 - di}
		{@const isDragTarget = dragOverIdx === ri && dragFromIdx !== null && dragFromIdx !== ri}
		<div
			class="group rounded p-1.5 transition-colors hover:bg-muted/50 cursor-default {dragFromIdx === ri ? 'opacity-40' : ''} {isDragTarget ? 'ring-1 ring-foreground/40' : ''}"
			draggable="true"
			ondragstart={(e) => onDragStart(e, ri)}
			ondragover={(e) => onDragOver(e, ri)}
			ondragleave={() => onDragLeave(ri)}
			ondrop={(e) => onDrop(e, ri)}
			ondragend={onDragEnd}
			role="listitem"
		>
			<!-- Top row: drag handle + checkbox + label + count + actions -->
			<div class="flex items-center gap-1.5">
				<!-- Drag handle -->
				<div class="shrink-0 cursor-grab text-muted-foreground/30 hover:text-muted-foreground/70 transition-colors active:cursor-grabbing">
					<GripVertical size={13} />
				</div>

				<!-- Checkbox + label -->
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

				<!-- Action buttons — always visible -->
				<div class="flex shrink-0 items-center gap-0.5">
					<button
						onclick={() => handleZoom(layer.id)}
						class="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/50 hover:bg-muted hover:text-foreground transition-colors"
						title="Zoom to {layer.label}"
						aria-label="Zoom to {layer.label}"
					>
						<ZoomIn size={12} />
					</button>
					{#if TABLE_LAYERS.has(layer.id)}
						<button
							onclick={() => openTable(layer.id)}
							class="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/50 hover:bg-muted hover:text-foreground transition-colors"
							title="Open attribute table"
							aria-label="Open attribute table for {layer.label}"
						>
							<Table2 size={12} />
						</button>
					{/if}
				</div>
			</div>
			<!-- Description -->
			<div class="mt-0.5 pl-7 text-[10px] leading-tight text-muted-foreground/60">{layer.description}</div>
		</div>
	{/each}
</div>
