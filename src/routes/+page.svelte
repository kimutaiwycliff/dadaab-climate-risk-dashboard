<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_FIRMS_MAP_KEY } from '$env/static/public';
	import { data, loadAllData } from '$lib/stores/dataStore.svelte';
	import MapContainer from '$lib/components/map/MapContainer.svelte';
	import RiskLegend from '$lib/components/map/RiskLegend.svelte';
	import MapAttribution from '$lib/components/map/MapAttribution.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import MobileSheet from '$lib/components/layout/MobileSheet.svelte';
	import LoadingOverlay from '$lib/components/layout/LoadingOverlay.svelte';

	// Mobile stats strip chips
	import { fireCountToRisk, riskLevelColor } from '$lib/utils/riskColors';

	let showOverlay = $state(true);
	let mobileSheet: MobileSheet | undefined = $state();

	let allLoaded = $derived(
		Object.values(data.loading).every((s) => s === 'success' || s === 'error' || s === 'idle')
	);

	$effect(() => {
		if (allLoaded && showOverlay) {
			// Small delay so users can see the final state
			setTimeout(() => { showOverlay = false; }, 600);
		}
	});

	onMount(() => {
		loadAllData(PUBLIC_FIRMS_MAP_KEY ?? 'demo');
	});
</script>

<svelte:head>
	<title>Dadaab Climate Risk Dashboard</title>
</svelte:head>

<LoadingOverlay visible={showOverlay} />

<div class="flex h-screen flex-col overflow-hidden">
	<Header onMenuClick={() => mobileSheet?.openSheet()} />

	<div class="flex flex-1 overflow-hidden">
		<!-- Desktop sidebar -->
		<aside
			class="hidden w-[300px] shrink-0 flex-col overflow-y-auto border-r border-[hsl(222_35%_18%)] lg:flex"
			aria-label="Dashboard panels"
		>
			<Sidebar />
		</aside>

		<!-- Map area -->
		<main class="relative min-w-0 flex-1">
			<MapContainer />

			<!-- Mobile stats strip -->
			<div class="absolute left-2 right-2 top-2 z-10 flex gap-2 overflow-x-auto lg:hidden">
				<div class="flex shrink-0 items-center gap-1.5 rounded-full border border-[hsl(222_35%_18%)] bg-[hsl(222_40%_11%)]/90 px-3 py-1.5 backdrop-blur-sm">
					<span class="font-mono text-xs font-semibold" style="color: {riskLevelColor(fireCountToRisk(data.fires.length))}">
						🔥 {data.fires.length} fires
					</span>
				</div>
				{#if data.drought}
					<div class="flex shrink-0 items-center gap-1.5 rounded-full border border-[hsl(222_35%_18%)] bg-[hsl(222_40%_11%)]/90 px-3 py-1.5 backdrop-blur-sm">
						<span class="text-xs font-semibold" style="color: {data.drought.color}">
							🏜️ {data.drought.label}
						</span>
					</div>
				{/if}
				{#if data.population.length > 0}
					<div class="flex shrink-0 items-center gap-1.5 rounded-full border border-[hsl(222_35%_18%)] bg-[hsl(222_40%_11%)]/90 px-3 py-1.5 backdrop-blur-sm">
						<span class="font-mono text-xs font-semibold text-[hsl(142_71%_45%)]">
							👥 {(data.population[data.population.length - 1]?.total / 1000).toFixed(0)}k
						</span>
					</div>
				{/if}
			</div>

			<!-- Risk legend -->
			<RiskLegend class="absolute bottom-8 right-4 z-10" />

			<!-- Attribution -->
			<MapAttribution class="absolute bottom-2 left-2 z-10" />
		</main>
	</div>
</div>

<!-- Mobile bottom sheet -->
<MobileSheet bind:this={mobileSheet} />
