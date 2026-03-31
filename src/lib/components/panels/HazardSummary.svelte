<script lang="ts">
	import { data } from '$lib/stores/dataStore.svelte';
	import { fireCountToRisk, seismicCountToRisk, droughtSeverityToRisk, riskLevelBg } from '$lib/utils/riskColors';
	import type { RiskLevel } from '$lib/types';

	interface HazardRow {
		emoji: string;
		label: string;
		risk: RiskLevel;
		source: string;
	}

	let hazards = $derived<HazardRow[]>([
		{ emoji: '🔥', label: 'Fire Hazard', risk: fireCountToRisk(data.fires.length), source: 'NASA FIRMS' },
		{ emoji: '💧', label: 'Flood Risk', risk: 'HIGH', source: 'SRTM/Static' },
		{ emoji: '🏜️', label: 'Drought Severity', risk: data.drought ? droughtSeverityToRisk(data.drought.severity) : 'MEDIUM', source: 'Open-Meteo' },
		{ emoji: '🌍', label: 'Seismic Background', risk: seismicCountToRisk(data.earthquakes.length), source: 'USGS' },
		{ emoji: '👥', label: 'Social Vulnerability', risk: 'HIGH', source: 'UNHCR/Static' }
	]);
</script>

<div>
	<div class="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
		Hazard Summary
	</div>
	<div class="space-y-1.5">
		{#each hazards as h}
			<div class="flex items-center justify-between gap-2">
				<div class="flex items-center gap-1.5 min-w-0">
					<span class="text-sm">{h.emoji}</span>
					<div class="min-w-0">
						<div class="text-xs font-medium text-foreground truncate">{h.label}</div>
						<div class="text-[9px] text-muted-foreground/60">{h.source}</div>
					</div>
				</div>
				<span class="shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-bold {riskLevelBg(h.risk)}">
					{h.risk}
				</span>
			</div>
		{/each}
	</div>
</div>
