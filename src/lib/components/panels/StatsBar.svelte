<script lang="ts">
	import { data } from '$lib/stores/dataStore.svelte';
	import { formatPopulation } from '$lib/utils/dateUtils';
	import { fireCountToRisk, riskLevelColor } from '$lib/utils/riskColors';
	import { Flame, Users, CloudRain, Activity } from 'lucide-svelte';

	let latestPop = $derived(
		data.population.length > 0 ? data.population[data.population.length - 1] : null
	);
	let fireRisk = $derived(fireCountToRisk(data.fires.length));
</script>

<div class="grid grid-cols-2 gap-2">
	<!-- Population -->
	<div class="rounded-md border border-[hsl(222_35%_18%)] bg-[hsl(222_40%_11%)] p-3">
		<div class="flex items-center gap-1.5 text-[hsl(215_20%_55%)]">
			<Users size={12} />
			<span class="text-[10px] uppercase tracking-widest">Population</span>
		</div>
		{#if data.loading.population === 'loading'}
			<div class="mt-1.5 h-5 w-20 animate-pulse rounded bg-[hsl(222_35%_18%)]"></div>
		{:else if latestPop}
			<div class="mt-1 font-mono text-lg font-semibold text-[hsl(210_40%_98%)]">
				{formatPopulation(latestPop.total)}
			</div>
		{:else}
			<div class="mt-1 font-mono text-lg font-semibold text-[hsl(210_40%_98%)]">753k+</div>
		{/if}
		<div class="mt-0.5 text-[10px] text-[hsl(215_20%_45%)]">Refugees in Kenya</div>
	</div>

	<!-- Active Fires -->
	<div class="rounded-md border border-[hsl(222_35%_18%)] bg-[hsl(222_40%_11%)] p-3">
		<div class="flex items-center gap-1.5 text-[hsl(215_20%_55%)]">
			<Flame size={12} />
			<span class="text-[10px] uppercase tracking-widest">Active Fires</span>
		</div>
		{#if data.loading.firms === 'loading'}
			<div class="mt-1.5 h-5 w-12 animate-pulse rounded bg-[hsl(222_35%_18%)]"></div>
		{:else}
			<div class="mt-1 font-mono text-lg font-semibold" style="color: {riskLevelColor(fireRisk)}">
				{data.fires.length}
			</div>
		{/if}
		<div class="mt-0.5 text-[10px] text-[hsl(215_20%_45%)]">Last 7 days (VIIRS)</div>
	</div>

	<!-- Drought -->
	<div class="rounded-md border border-[hsl(222_35%_18%)] bg-[hsl(222_40%_11%)] p-3">
		<div class="flex items-center gap-1.5 text-[hsl(215_20%_55%)]">
			<CloudRain size={12} />
			<span class="text-[10px] uppercase tracking-widest">Drought</span>
		</div>
		{#if data.loading.drought === 'loading'}
			<div class="mt-1.5 h-5 w-24 animate-pulse rounded bg-[hsl(222_35%_18%)]"></div>
		{:else if data.drought}
			<div class="mt-1 text-sm font-semibold" style="color: {data.drought.color}">
				{data.drought.label}
			</div>
		{:else}
			<div class="mt-1 text-sm text-[hsl(215_20%_55%)]">—</div>
		{/if}
		<div class="mt-0.5 text-[10px] text-[hsl(215_20%_45%)]">ET₀ deficit 30d</div>
	</div>

	<!-- Earthquakes -->
	<div class="rounded-md border border-[hsl(222_35%_18%)] bg-[hsl(222_40%_11%)] p-3">
		<div class="flex items-center gap-1.5 text-[hsl(215_20%_55%)]">
			<Activity size={12} />
			<span class="text-[10px] uppercase tracking-widest">Seismic</span>
		</div>
		{#if data.loading.earthquakes === 'loading'}
			<div class="mt-1.5 h-5 w-8 animate-pulse rounded bg-[hsl(222_35%_18%)]"></div>
		{:else}
			<div class="mt-1 font-mono text-lg font-semibold text-[hsl(336_80%_58%)]">
				{data.earthquakes.length}
			</div>
		{/if}
		<div class="mt-0.5 text-[10px] text-[hsl(215_20%_45%)]">M2.0+, last 30 days</div>
	</div>
</div>
