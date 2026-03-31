<script lang="ts">
	import type { UNHCRPopulation } from '$lib/types';

	let { population } = $props<{ population: UNHCRPopulation[] }>();

	const W = 220;
	const H = 50;
	const BAR_W = 26;
	const MAX_POP = 800_000;

	let bars = $derived(
		population.map((p: UNHCRPopulation, i: number) => ({
			year: p.year,
			total: p.total,
			h: (p.total / MAX_POP) * H,
			x: i * (BAR_W + 4)
		}))
	);
</script>

<svg
	viewBox="0 0 {(BAR_W + 4) * population.length - 4} {H + 14}"
	width="100%"
	height={H + 14}
	aria-label="Refugee population trend 2019-2024"
>
	{#each bars as bar}
		<rect
			x={bar.x}
			y={H - bar.h}
			width={BAR_W}
			height={bar.h}
			rx="2"
			fill="#22c55e"
			opacity="0.8"
		/>
		<text
			x={bar.x + BAR_W / 2}
			y={H + 10}
			text-anchor="middle"
			font-size="7.5"
			fill="hsl(215 20% 45%)"
			font-family="IBM Plex Mono, monospace"
		>
			{bar.year}
		</text>
	{/each}
</svg>
