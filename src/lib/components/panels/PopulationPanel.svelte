<script lang="ts">
	import { data } from '$lib/stores/dataStore.svelte';
	import { formatPopulation } from '$lib/utils/dateUtils';
	import PopTrend from '$lib/components/charts/PopTrend.svelte';

	let latestPop = $derived(
		data.population.length > 0 ? data.population[data.population.length - 1] : null
	);
</script>

<div>
	<div class="mb-1 text-xs font-semibold uppercase tracking-widest text-[hsl(215_20%_55%)]">
		Refugee Population Trend
	</div>
	<div class="mb-2 text-[10px] text-[hsl(215_20%_45%)]">Source: UNHCR Data API</div>

	{#if data.loading.population === 'loading'}
		<div class="h-20 animate-pulse rounded bg-[hsl(222_35%_18%)]"></div>
	{:else if latestPop}
		<div class="mb-3">
			<div class="font-mono text-2xl font-bold text-[hsl(142_71%_45%)]">
				{formatPopulation(latestPop.total)}
			</div>
			<div class="text-[10px] text-[hsl(215_20%_55%)]">
				Refugees + Asylum Seekers in Kenya ({latestPop.year})
			</div>
		</div>
		<PopTrend population={data.population} />
		<div class="mt-1.5 text-[9px] text-[hsl(215_20%_40%)]">Data: UNHCR Refugee Population Statistics</div>
	{:else}
		<div class="text-xs text-[hsl(215_20%_45%)]">Population data unavailable</div>
	{/if}
</div>
