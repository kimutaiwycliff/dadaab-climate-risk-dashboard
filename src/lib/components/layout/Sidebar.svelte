<script lang="ts">
	import StatsBar from '$lib/components/panels/StatsBar.svelte';
	import LayerControls from '$lib/components/map/LayerControls.svelte';
	import WeatherPanel from '$lib/components/panels/WeatherPanel.svelte';
	import DroughtIndex from '$lib/components/panels/DroughtIndex.svelte';
	import HazardSummary from '$lib/components/panels/HazardSummary.svelte';
	import PopulationPanel from '$lib/components/panels/PopulationPanel.svelte';
	import DataSources from '$lib/components/panels/DataSources.svelte';
</script>

<div class="flex flex-col gap-3 p-4 bg-background">
	<StatsBar />
	<div class="border-t border-border"></div>
	<LayerControls />
	<div class="border-t border-border"></div>
	<WeatherPanel />
	<div class="border-t border-border"></div>
	<DroughtIndex />
	<div class="border-t border-border"></div>
	<HazardSummary />
	<div class="border-t border-border"></div>
	<PopulationPanel />
	<div class="border-t border-border"></div>
	<DataSources />
</div>
