<script lang="ts">
	import { data } from '$lib/stores/dataStore.svelte';
	import type { LoadingState } from '$lib/types';

	interface Source {
		label: string;
		key: string;
		static?: boolean;
	}

	const sources: Source[] = [
		{ label: 'NASA FIRMS (fires)', key: 'firms' },
		{ label: 'Open-Meteo (weather)', key: 'weather' },
		{ label: 'UNHCR (population)', key: 'population' },
		{ label: 'OpenStreetMap/Overpass', key: 'overpass' },
		{ label: 'USGS (earthquakes)', key: 'earthquakes' },
		{ label: 'FEWS NET (drought zones)', key: 'fewsnet', static: true },
		{ label: 'SRTM/DEM (flood zones)', key: 'srtm', static: true }
	];

	function dotColor(key: string, isStatic?: boolean): string {
		if (isStatic) return '#6b7280';
		const state = data.loading[key] as LoadingState | undefined;
		switch (state) {
			case 'success': return '#22c55e';
			case 'loading': return '#eab308';
			case 'error': return '#ef4444';
			default: return '#6b7280';
		}
	}

	function dotLabel(key: string, isStatic?: boolean): string {
		if (isStatic) return 'static';
		const state = data.loading[key] as LoadingState | undefined;
		switch (state) {
			case 'success': return data.firmsIsDemo && key === 'firms' ? 'demo' : 'live';
			case 'loading': return 'loading…';
			case 'error': return 'error';
			default: return 'idle';
		}
	}
</script>

<div>
	<div class="mb-2 text-xs font-semibold uppercase tracking-widest text-[hsl(215_20%_55%)]">
		Live Data Sources
	</div>
	<div class="space-y-1">
		{#each sources as src}
			<div class="flex items-center justify-between gap-2">
				<span class="text-[10px] text-[hsl(215_20%_55%)] truncate">{src.label}</span>
				<div class="flex shrink-0 items-center gap-1">
					<div
						class="h-1.5 w-1.5 rounded-full"
						class:animate-pulse={data.loading[src.key] === 'loading'}
						style="background-color: {dotColor(src.key, src.static)}"
					></div>
					<span class="font-mono text-[9px]" style="color: {dotColor(src.key, src.static)}">
						{dotLabel(src.key, src.static)}
					</span>
				</div>
			</div>
		{/each}
	</div>
	{#if data.firmsIsDemo}
		<div class="mt-2 rounded border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 text-[10px] text-yellow-400">
			Demo mode — configure FIRMS API key for live fire data
		</div>
	{/if}
</div>
