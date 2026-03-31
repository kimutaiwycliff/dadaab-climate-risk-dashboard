<script lang="ts">
	import { data } from '$lib/stores/dataStore.svelte';

	const MAX_DEFICIT = 300;

	let fillPct = $derived(
		data.drought ? Math.min(100, (data.drought.deficit_mm / MAX_DEFICIT) * 100) : 0
	);
</script>

<div>
	<div class="mb-1 text-xs font-semibold uppercase tracking-widest text-[hsl(215_20%_55%)]">
		30-Day Drought Index
	</div>
	<div class="mb-2 text-[10px] text-[hsl(215_20%_45%)]">ET₀ vs Precipitation Deficit</div>

	{#if data.loading.drought === 'loading'}
		<div class="h-20 animate-pulse rounded bg-[hsl(222_35%_18%)]"></div>
	{:else if data.drought}
		<!-- Gauge -->
		<div class="mb-2 h-3 w-full overflow-hidden rounded-full bg-[hsl(222_35%_18%)]">
			<div
				class="h-full rounded-full transition-all duration-700"
				style="width: {fillPct}%; background-color: {data.drought.color}"
			></div>
		</div>

		<!-- Stats row -->
		<div class="mb-2 flex items-center justify-between font-mono text-[10px] text-[hsl(215_20%_55%)]">
			<span>ET₀: <span class="text-[hsl(210_40%_98%)]">{data.drought.totalET0?.toFixed(0) ?? '—'}mm</span></span>
			<span>Rain: <span class="text-[hsl(217_91%_60%)]">{data.drought.totalPrecip?.toFixed(0) ?? '—'}mm</span></span>
			<span>Deficit: <span style="color: {data.drought.color}">{data.drought.deficit_mm.toFixed(0)}mm</span></span>
		</div>

		<!-- Badge -->
		<div class="inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold"
			style="color: {data.drought.color}; border-color: {data.drought.color}44; background-color: {data.drought.color}18">
			{data.drought.label}
		</div>

		<div class="mt-2 text-[10px] text-[hsl(215_20%_40%)]">Source: Open-Meteo Archive API</div>
	{:else}
		<div class="text-xs text-[hsl(215_20%_45%)]">Drought data unavailable</div>
	{/if}
</div>
