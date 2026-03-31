<script lang="ts">
	import { data } from '$lib/stores/dataStore.svelte';
	import type { LoadingState } from '$lib/types';
	import { Globe } from 'lucide-svelte';

	let { visible = true } = $props<{ visible?: boolean }>();

	interface Source { label: string; key: string }

	const sources: Source[] = [
		{ label: 'NASA FIRMS fire hotspots', key: 'firms' },
		{ label: 'Open-Meteo weather & drought', key: 'weather' },
		{ label: 'UNHCR refugee population', key: 'population' },
		{ label: 'OSM infrastructure data', key: 'overpass' },
		{ label: 'USGS seismic data', key: 'earthquakes' }
	];

	function getIcon(key: string): string {
		const s = (data.loading[key] ?? 'idle') as LoadingState;
		if (s === 'success') return '✓';
		if (s === 'error') return '✗';
		if (s === 'loading') return '○';
		return '·';
	}

	function getColor(key: string): string {
		const s = (data.loading[key] ?? 'idle') as LoadingState;
		if (s === 'success') return '#22c55e';
		if (s === 'error') return '#ef4444';
		if (s === 'loading') return '#eab308';
		return '#6b7280';
	}

	let progress = $derived(
		sources.filter((s) => data.loading[s.key] === 'success' || data.loading[s.key] === 'error').length / sources.length * 100
	);
</script>

{#if visible}
	<div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
		<div class="flex flex-col items-center gap-6 max-w-sm w-full px-8">
			<div class="flex items-center gap-3">
				<Globe size={32} class="text-[hsl(142_71%_45%)]" />
				<div>
					<div class="text-lg font-bold text-[hsl(142_71%_45%)]">Dadaab</div>
					<div class="text-xs text-muted-foreground">Climate Risk Dashboard</div>
				</div>
			</div>

			<div class="text-center">
				<div class="text-sm font-medium text-foreground">Loading climate risk data...</div>
				<div class="mt-1 text-xs text-muted-foreground">Garissa County, Kenya</div>
			</div>

			<div class="w-full space-y-2 rounded-md border border-border bg-card p-4">
				{#each sources as src}
					<div class="flex items-center justify-between gap-3">
						<span class="text-xs text-muted-foreground">{src.label}</span>
						<span
							class="font-mono text-xs font-bold transition-colors"
							class:animate-pulse={data.loading[src.key] === 'loading'}
							style="color: {getColor(src.key)}"
						>
							{getIcon(src.key)}
						</span>
					</div>
				{/each}
			</div>

			<div class="w-full">
				<div class="h-1 w-full overflow-hidden rounded-full bg-muted">
					<div
						class="h-full rounded-full bg-[hsl(142_71%_45%)] transition-all duration-500"
						style="width: {progress}%"
					></div>
				</div>
			</div>
		</div>
	</div>
{/if}
