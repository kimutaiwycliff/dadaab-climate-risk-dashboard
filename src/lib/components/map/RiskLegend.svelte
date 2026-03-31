<script lang="ts">
	let { class: className = '' } = $props<{ class?: string }>();
</script>

<div class="rounded-md border border-border bg-card/90 p-2.5 backdrop-blur-sm {className}">
	<div class="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Risk Index</div>
	<div class="flex items-center gap-1.5">
		<div class="h-2 w-28 rounded-full" style="background: linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444, #8b0000)"></div>
	</div>
	<div class="mt-0.5 flex justify-between text-[9px] text-muted-foreground/60">
		<span>Low</span>
		<span>Med</span>
		<span>High</span>
		<span>Critical</span>
	</div>
	<div class="mt-2 space-y-0.5">
		{#each [
			{ color: '#f97316', label: 'Fire hotspot' },
			{ color: '#3b82f6', label: 'Flood zone' },
			{ color: '#cc3300', label: 'Drought zone' },
			{ color: '#22c55e', label: 'Camp' },
		] as item}
			<div class="flex items-center gap-1.5">
				<div class="h-2.5 w-2.5 rounded-full" style="background-color: {item.color}"></div>
				<span class="text-[10px] text-muted-foreground">{item.label}</span>
			</div>
		{/each}
	</div>
</div>
