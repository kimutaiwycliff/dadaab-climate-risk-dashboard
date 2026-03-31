<script lang="ts">
	import { data } from '$lib/stores/dataStore.svelte';
	import { formatDateTime } from '$lib/utils/dateUtils';
	import ThemeToggle from './ThemeToggle.svelte';
	import { Globe, Menu } from 'lucide-svelte';

	let { onMenuClick = () => {} } = $props<{ onMenuClick?: () => void }>();

	type LoadingStatus = 'success' | 'loading' | 'error' | 'idle';

	interface ApiStatus {
		label: string;
		key: string;
	}

	const apiStatuses: ApiStatus[] = [
		{ label: 'FIRMS', key: 'firms' },
		{ label: 'Weather', key: 'weather' },
		{ label: 'UNHCR', key: 'population' },
		{ label: 'OSM', key: 'overpass' },
		{ label: 'USGS', key: 'earthquakes' }
	];

	function statusColor(key: string): string {
		const s = (data.loading[key] ?? 'idle') as LoadingStatus;
		return s === 'success' ? '#22c55e' : s === 'loading' ? '#eab308' : s === 'error' ? '#ef4444' : '#6b7280';
	}
</script>

<header
	class="flex h-14 shrink-0 items-center justify-between border-b border-[hsl(222_35%_18%)] bg-[hsl(222_47%_7%)]/80 px-4 backdrop-blur-sm"
	style="position: sticky; top: 0; z-index: 50;"
>
	<!-- Left: Logo -->
	<div class="flex items-center gap-2">
		<Globe size={18} class="text-[hsl(142_71%_45%)]" />
		<div class="flex items-baseline gap-1.5">
			<span class="text-sm font-bold text-[hsl(142_71%_45%)]">Dadaab</span>
			<span class="hidden text-sm font-medium text-[hsl(210_40%_98%)] sm:inline">Climate Risk Dashboard</span>
			<span class="rounded-sm border border-[hsl(142_71%_45%)/30] bg-[hsl(142_71%_45%)/15] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[hsl(142_71%_45%)]">
				KEN
			</span>
		</div>
	</div>

	<!-- Center: API status dots (desktop only) -->
	<div class="hidden items-center gap-3 lg:flex">
		{#each apiStatuses as api}
			<div class="flex items-center gap-1">
				<div
					class="h-1.5 w-1.5 rounded-full"
					class:animate-pulse={data.loading[api.key] === 'loading'}
					style="background-color: {statusColor(api.key)}"
					title="{api.label}: {data.loading[api.key] ?? 'idle'}"
				></div>
				<span class="text-[10px] text-[hsl(215_20%_45%)]">{api.label}</span>
			</div>
		{/each}
	</div>

	<!-- Right: Theme + timestamp + mobile menu -->
	<div class="flex items-center gap-2">
		{#if data.lastUpdated}
			<span class="hidden font-mono text-[10px] text-[hsl(215_20%_45%)] xl:block">
				Updated {formatDateTime(data.lastUpdated)}
			</span>
		{/if}
		<ThemeToggle />
		<button
			class="flex h-8 w-8 items-center justify-center rounded-md border border-[hsl(222_35%_18%)] text-[hsl(215_20%_55%)] transition-colors hover:bg-[hsl(222_35%_18%)] hover:text-[hsl(210_40%_98%)] lg:hidden"
			onclick={onMenuClick}
			aria-label="Open menu"
		>
			<Menu size={16} />
		</button>
	</div>
</header>
