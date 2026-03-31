<script lang="ts">
	import type { WeatherDaily } from '$lib/types';
	import { dayName } from '$lib/utils/dateUtils';

	let { daily } = $props<{ daily: WeatherDaily }>();

	const BAR_MAX_H = 40;
	const BAR_W = 24;
	const GAP = 4;
	const CHART_H = BAR_MAX_H + 20;

	let bars = $derived(
		daily.time.map((t: string, i: number) => ({
			day: dayName(t),
			pct: daily.precipitation_probability_max[i] ?? 0,
			h: ((daily.precipitation_probability_max[i] ?? 0) / 100) * BAR_MAX_H
		}))
	);

	let totalW = $derived(bars.length * (BAR_W + GAP) - GAP);
</script>

<svg
	viewBox="0 0 {totalW} {CHART_H}"
	width="100%"
	height={CHART_H}
	aria-label="7-day precipitation probability chart"
>
	{#each bars as bar, i}
		{@const x = i * (BAR_W + GAP)}
		{@const y = BAR_MAX_H - bar.h}
		<!-- Bar -->
		<rect
			x={x}
			y={y}
			width={BAR_W}
			height={bar.h || 1}
			rx="2"
			fill={bar.pct > 60 ? '#3b82f6' : bar.pct > 30 ? '#60a5fa' : '#93c5fd'}
			opacity="0.85"
		/>
		<!-- Day label -->
		<text
			x={x + BAR_W / 2}
			y={CHART_H - 2}
			text-anchor="middle"
			font-size="8"
			fill="hsl(215 20% 45%)"
			font-family="IBM Plex Mono, monospace"
		>
			{bar.day}
		</text>
		<!-- Pct label on bar if tall enough -->
		{#if bar.h > 12}
			<text
				x={x + BAR_W / 2}
				y={y + 9}
				text-anchor="middle"
				font-size="7.5"
				fill="white"
				font-family="IBM Plex Mono, monospace"
			>
				{bar.pct}%
			</text>
		{/if}
	{/each}
</svg>
