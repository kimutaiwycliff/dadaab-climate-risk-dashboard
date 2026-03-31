<script lang="ts">
	let { class: className = '' } = $props<{ class?: string }>();
</script>

<div class="rounded text-[9px] text-[hsl(215_20%_45%)] {className}">
	© <a href="https://carto.com" target="_blank" rel="noopener noreferrer" class="hover:text-[hsl(215_20%_65%)]">CARTO</a>
	| © <a href="https://openstreetmap.org" target="_blank" rel="noopener noreferrer" class="hover:text-[hsl(215_20%_65%)]">OpenStreetMap</a>
	| NASA FIRMS | USGS | UNHCR | Open-Meteo
</div>
