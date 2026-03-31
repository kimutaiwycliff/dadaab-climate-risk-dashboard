<script lang="ts">
	import { layers } from '$lib/stores/layerStore.svelte';
	import { data } from '$lib/stores/dataStore.svelte';

	function toggleLayer(id: string) {
		const layer = layers.find((l) => l.id === id);
		if (layer) layer.visible = !layer.visible;
	}

	function getCount(id: string): number | undefined {
		switch (id) {
			case 'fire-hotspots': return data.fires.length;
			case 'earthquakes': return data.earthquakes.length;
			case 'health': return data.healthFacilities.filter(f => f.lat).length;
			case 'water': return data.waterPoints.filter(f => f.lat).length;
			case 'camps': return 5;
			default: return undefined;
		}
	}
</script>

<div class="space-y-1">
	<div class="mb-2 text-xs font-semibold uppercase tracking-widest text-[hsl(215_20%_55%)]">Map Layers</div>
	{#each layers as layer (layer.id)}
		<button
			class="flex w-full items-start gap-2.5 rounded p-1.5 text-left transition-colors hover:bg-[hsl(222_35%_18%)]"
			onclick={() => toggleLayer(layer.id)}
			aria-label="Toggle {layer.label} layer"
		>
			<!-- Color dot + toggle indicator -->
			<div class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors"
				style="border-color: {layer.color}; background-color: {layer.visible ? layer.color : 'transparent'}">
				{#if layer.visible}
					<svg width="10" height="8" viewBox="0 0 10 8" fill="none">
						<path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				{/if}
			</div>
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-1.5">
					<span class="text-xs font-medium leading-tight" class:text-[hsl(210_40%_98%)]={layer.visible} class:text-[hsl(215_20%_55%)]={!layer.visible}>
						{layer.label}
					</span>
					{#if getCount(layer.id) !== undefined}
						<span class="shrink-0 rounded-full px-1.5 py-0 text-[10px] font-mono" style="background-color: {layer.color}22; color: {layer.color}">
							{getCount(layer.id)}
						</span>
					{/if}
				</div>
				<div class="mt-0.5 text-[10px] leading-tight text-[hsl(215_20%_45%)]">{layer.description}</div>
			</div>
		</button>
	{/each}
</div>
