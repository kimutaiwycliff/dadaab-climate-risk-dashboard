<script lang="ts">
	import StatsBar from '$lib/components/panels/StatsBar.svelte';
	import LayerControls from '$lib/components/map/LayerControls.svelte';
	import WeatherPanel from '$lib/components/panels/WeatherPanel.svelte';
	import DroughtIndex from '$lib/components/panels/DroughtIndex.svelte';
	import HazardSummary from '$lib/components/panels/HazardSummary.svelte';
	import PopulationPanel from '$lib/components/panels/PopulationPanel.svelte';
	import DataSources from '$lib/components/panels/DataSources.svelte';
</script>

<div class="flex flex-col gap-3 p-4">
	<StatsBar />
	<div class="border-t border-[hsl(222_35%_18%)]"></div>
	<LayerControls />
	<div class="border-t border-[hsl(222_35%_18%)]"></div>
	<WeatherPanel />
	<div class="border-t border-[hsl(222_35%_18%)]"></div>
	<DroughtIndex />
	<div class="border-t border-[hsl(222_35%_18%)]"></div>
	<HazardSummary />
	<div class="border-t border-[hsl(222_35%_18%)]"></div>
	<PopulationPanel />
	<div class="border-t border-[hsl(222_35%_18%)]"></div>
	<DataSources />
</div>
