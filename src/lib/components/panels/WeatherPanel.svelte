<script lang="ts">
	import { data } from '$lib/stores/dataStore.svelte';
	import { weatherCodeToLabel } from '$lib/api/openmeteo';
	import RainfallSparkline from '$lib/components/charts/RainfallSparkline.svelte';
	import { Wind, Droplets, Thermometer } from 'lucide-svelte';
</script>

<div>
	<div class="mb-2 text-xs font-semibold uppercase tracking-widest text-[hsl(215_20%_55%)]">
		Current Weather
	</div>
	<div class="text-[10px] text-[hsl(215_20%_45%)] mb-2">Dadaab (1.65°N 40.35°E)</div>

	{#if data.loading.weather === 'loading'}
		<div class="space-y-2">
			<div class="h-6 w-full animate-pulse rounded bg-[hsl(222_35%_18%)]"></div>
			<div class="h-4 w-3/4 animate-pulse rounded bg-[hsl(222_35%_18%)]"></div>
		</div>
	{:else if data.weather}
		{@const wl = weatherCodeToLabel(data.weather.current.weather_code)}
		<div class="flex items-center gap-2 mb-3">
			<span class="text-2xl">{wl.emoji}</span>
			<div>
				<div class="text-base font-semibold text-[hsl(210_40%_98%)]">{wl.label}</div>
				<div class="font-mono text-xs text-[hsl(215_20%_55%)]">{data.weather.current.time}</div>
			</div>
		</div>
		<div class="grid grid-cols-3 gap-2 mb-3">
			<div class="rounded bg-[hsl(222_35%_18%)] p-2 text-center">
				<Thermometer size={12} class="mx-auto mb-0.5 text-[hsl(14_100%_57%)]" />
				<div class="font-mono text-sm font-semibold text-[hsl(210_40%_98%)]">
					{data.weather.current.temperature_2m.toFixed(1)}°C
				</div>
				<div class="text-[9px] text-[hsl(215_20%_45%)]">Temp</div>
			</div>
			<div class="rounded bg-[hsl(222_35%_18%)] p-2 text-center">
				<Droplets size={12} class="mx-auto mb-0.5 text-[hsl(217_91%_60%)]" />
				<div class="font-mono text-sm font-semibold text-[hsl(210_40%_98%)]">
					{data.weather.current.relative_humidity_2m}%
				</div>
				<div class="text-[9px] text-[hsl(215_20%_45%)]">Humidity</div>
			</div>
			<div class="rounded bg-[hsl(222_35%_18%)] p-2 text-center">
				<Wind size={12} class="mx-auto mb-0.5 text-[hsl(215_20%_65%)]" />
				<div class="font-mono text-sm font-semibold text-[hsl(210_40%_98%)]">
					{data.weather.current.wind_speed_10m.toFixed(1)}
				</div>
				<div class="text-[9px] text-[hsl(215_20%_45%)]">km/h</div>
			</div>
		</div>
		<div class="text-[10px] font-medium text-[hsl(215_20%_55%)] mb-1.5">7-Day Precipitation Probability</div>
		<RainfallSparkline daily={data.weather.daily} />
	{:else}
		<div class="text-xs text-[hsl(215_20%_45%)]">Weather data unavailable</div>
	{/if}
</div>
