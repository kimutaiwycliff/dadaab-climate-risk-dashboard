import type {
	FIRMSHotspot,
	WeatherData,
	DroughtAssessment,
	OSMFeature,
	Earthquake,
	UNHCRPopulation,
	LoadingState
} from '$lib/types';

interface DataState {
	fires: FIRMSHotspot[];
	weather: WeatherData | null;
	drought: DroughtAssessment | null;
	healthFacilities: OSMFeature[];
	waterPoints: OSMFeature[];
	roads: OSMFeature[];
	earthquakes: Earthquake[];
	population: UNHCRPopulation[];
	loading: Record<string, LoadingState>;
	errors: Record<string, string>;
	firmsIsDemo: boolean;
	lastUpdated: Date | null;
}

export const data = $state<DataState>({
	fires: [],
	weather: null,
	drought: null,
	healthFacilities: [],
	waterPoints: [],
	roads: [],
	earthquakes: [],
	population: [],
	loading: {
		firms: 'idle',
		weather: 'idle',
		drought: 'idle',
		overpass: 'idle',
		earthquakes: 'idle',
		population: 'idle'
	},
	errors: {},
	firmsIsDemo: false,
	lastUpdated: null
});

export async function loadAllData(firmsApiKey: string) {
	const { fetchFIRMSHotspots } = await import('$lib/api/firms');
	const { fetchWeather, fetchDroughtData } = await import('$lib/api/openmeteo');
	const { fetchHealthFacilities, fetchWaterPoints, fetchRoads } = await import('$lib/api/overpass');
	const { fetchEarthquakes } = await import('$lib/api/usgs');
	const { fetchUNHCRData } = await import('$lib/api/unhcr');

	// Set all to loading
	data.loading = {
		firms: 'loading',
		weather: 'loading',
		drought: 'loading',
		overpass: 'loading',
		earthquakes: 'loading',
		population: 'loading'
	};

	// Run non-Overpass queries in parallel
	const [firmsResult, weatherResult, droughtResult, earthquakesResult, populationResult] = await Promise.allSettled([
		fetchFIRMSHotspots(firmsApiKey),
		fetchWeather(),
		fetchDroughtData(),
		fetchEarthquakes(),
		fetchUNHCRData()
	]);

	if (firmsResult.status === 'fulfilled') {
		data.fires = firmsResult.value.hotspots;
		data.firmsIsDemo = firmsResult.value.isDemo;
		data.loading.firms = 'success';
	} else {
		data.loading.firms = 'error';
		data.errors.firms = String(firmsResult.reason);
	}

	if (weatherResult.status === 'fulfilled') {
		data.weather = weatherResult.value;
		data.loading.weather = 'success';
	} else {
		data.loading.weather = 'error';
		data.errors.weather = String(weatherResult.reason);
	}

	if (droughtResult.status === 'fulfilled') {
		data.drought = droughtResult.value;
		data.loading.drought = 'success';
	} else {
		data.loading.drought = 'error';
		data.errors.drought = String(droughtResult.reason);
	}

	if (earthquakesResult.status === 'fulfilled') {
		data.earthquakes = earthquakesResult.value;
		data.loading.earthquakes = 'success';
	} else {
		data.loading.earthquakes = 'error';
		data.errors.earthquakes = String(earthquakesResult.reason);
	}

	if (populationResult.status === 'fulfilled') {
		data.population = populationResult.value;
		data.loading.population = 'success';
	} else {
		data.loading.population = 'error';
		data.errors.population = String(populationResult.reason);
	}

	// Overpass queries run sequentially to avoid rate limiting (overpass-api.de
	// enforces one concurrent request per IP; simultaneous requests get 429/timeout)
	let overpassOk = false;
	try {
		data.healthFacilities = await fetchHealthFacilities();
		overpassOk = true;
	} catch (e) {
		data.errors.overpass = `health: ${String(e)}`;
	}
	await new Promise((r) => setTimeout(r, 600));
	try {
		data.waterPoints = await fetchWaterPoints();
		overpassOk = true;
	} catch (e) {
		data.errors.overpass = (data.errors.overpass ? data.errors.overpass + ' | ' : '') + `water: ${String(e)}`;
	}
	await new Promise((r) => setTimeout(r, 600));
	try {
		data.roads = await fetchRoads();
		overpassOk = true;
	} catch (e) {
		data.errors.overpass = (data.errors.overpass ? data.errors.overpass + ' | ' : '') + `roads: ${String(e)}`;
	}
	data.loading.overpass = overpassOk ? 'success' : 'error';

	data.lastUpdated = new Date();
}
