<script lang="ts">
	import { theme, toggleTheme } from '$lib/stores/themeStore.svelte';
	import { Sun, Moon } from 'lucide-svelte';
</script>

<button
	class="flex h-8 w-8 items-center justify-center rounded-md border border-[hsl(222_35%_18%)] text-[hsl(215_20%_55%)] transition-colors hover:bg-[hsl(222_35%_18%)] hover:text-[hsl(210_40%_98%)]"
	onclick={toggleTheme}
	aria-label="Toggle {theme.isDark ? 'light' : 'dark'} mode"
	title="Toggle theme"
>
	{#if theme.isDark}
		<Sun size={14} />
	{:else}
		<Moon size={14} />
	{/if}
</button>
