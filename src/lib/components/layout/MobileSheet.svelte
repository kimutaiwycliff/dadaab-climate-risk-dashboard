<script lang="ts">
	import Sidebar from './Sidebar.svelte';
	import { layers } from '$lib/stores/layerStore.svelte';
	import { Layers, X } from 'lucide-svelte';

	let open = $state(false);
	let visibleCount = $derived(layers.filter((l) => l.visible).length);

	export function openSheet() { open = true; }
</script>

<!-- FAB trigger -->
<button
	class="fixed bottom-6 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card shadow-lg transition-colors hover:bg-muted lg:hidden"
	onclick={() => (open = true)}
	aria-label="Open layers panel"
>
	<Layers size={20} class="text-foreground" />
	{#if visibleCount > 0}
		<span class="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(142_71%_45%)] font-mono text-[9px] font-bold text-black">
			{visibleCount}
		</span>
	{/if}
</button>

{#if open}
	<div
		class="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
		onclick={() => (open = false)}
		aria-hidden="true"
	></div>

	<div
		class="fixed bottom-0 left-0 right-0 z-40 max-h-[85vh] overflow-y-auto rounded-t-xl border-t border-border bg-background lg:hidden"
		role="dialog"
		aria-modal="true"
		aria-label="Dashboard panels"
	>
		<div class="relative flex items-center justify-center px-4 py-3">
			<div class="h-1 w-10 rounded-full bg-muted"></div>
			<button
				class="absolute right-4 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
				onclick={() => (open = false)}
				aria-label="Close panel"
			>
				<X size={16} />
			</button>
		</div>
		<Sidebar />
	</div>
{/if}
