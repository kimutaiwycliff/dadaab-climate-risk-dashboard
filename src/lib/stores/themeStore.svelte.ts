import { syncBasemapToTheme } from './basemapStore.svelte';

export const theme = $state({ isDark: true });

export function toggleTheme() {
	theme.isDark = !theme.isDark;
	if (typeof document !== 'undefined') {
		document.documentElement.classList.toggle('dark', theme.isDark);
		document.documentElement.classList.toggle('light', !theme.isDark);
		localStorage.setItem('theme', theme.isDark ? 'dark' : 'light');
	}
	syncBasemapToTheme(theme.isDark);
}

export function initTheme() {
	if (typeof localStorage !== 'undefined') {
		const saved = localStorage.getItem('theme');
		theme.isDark = saved !== 'light';
	}
	if (typeof document !== 'undefined') {
		document.documentElement.classList.toggle('dark', theme.isDark);
		document.documentElement.classList.toggle('light', !theme.isDark);
	}
}
