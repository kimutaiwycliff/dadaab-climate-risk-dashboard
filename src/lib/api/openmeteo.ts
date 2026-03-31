import type { WeatherData, DroughtAssessment } from '$lib/types';

const BASE = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE = 'https://archive-api.open-meteo.com/v1/archive';
const LAT = 1.65;
const LNG = 40.35;

const fmt = (d: Date): string => d.toISOString().split('T')[0];

export async function fetchWeather(): Promise<WeatherData> {
	const params = new URLSearchParams({
		latitude: String(LAT),
		longitude: String(LNG),
		current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code',
		daily: 'precipitation_sum,et0_fao_evapotranspiration,precipitation_probability_max',
		forecast_days: '7',
		timezone: 'Africa/Nairobi'
	});

	const response = await fetch(`${BASE}?${params}`);
	if (!response.ok) throw new Error('Weather fetch failed');
	return response.json() as Promise<WeatherData>;
}

export async function fetchDroughtData(): Promise<DroughtAssessment> {
	const today = new Date();
	const thirtyDaysAgo = new Date(today);
	thirtyDaysAgo.setDate(today.getDate() - 30);

	const params = new URLSearchParams({
		latitude: String(LAT),
		longitude: String(LNG),
		start_date: fmt(thirtyDaysAgo),
		end_date: fmt(today),
		daily: 'precipitation_sum,et0_fao_evapotranspiration',
		timezone: 'Africa/Nairobi'
	});

	const response = await fetch(`${ARCHIVE}?${params}`);
	if (!response.ok) throw new Error('Archive weather fetch failed');
	const data = (await response.json()) as {
		daily: { precipitation_sum: number[]; et0_fao_evapotranspiration: number[] };
	};

	const totalPrecip = (data.daily.precipitation_sum as number[]).reduce(
		(a, b) => a + (b || 0),
		0
	);
	const totalET0 = (data.daily.et0_fao_evapotranspiration as number[]).reduce(
		(a, b) => a + (b || 0),
		0
	);
	const deficit = Math.max(0, totalET0 - totalPrecip);

	if (deficit > 200)
		return { deficit_mm: deficit, severity: 'extreme', label: 'Extreme Drought', color: '#8b0000', totalPrecip, totalET0 };
	if (deficit > 150)
		return { deficit_mm: deficit, severity: 'severe', label: 'Severe Drought', color: '#cc3300', totalPrecip, totalET0 };
	if (deficit > 80)
		return { deficit_mm: deficit, severity: 'moderate', label: 'Moderate Drought', color: '#ff8800', totalPrecip, totalET0 };
	return { deficit_mm: deficit, severity: 'normal', label: 'Near Normal', color: '#22c55e', totalPrecip, totalET0 };
}

export function weatherCodeToLabel(code: number): { emoji: string; label: string } {
	if (code === 0) return { emoji: '☀️', label: 'Clear sky' };
	if (code <= 3) return { emoji: '⛅', label: 'Partly cloudy' };
	if (code <= 49) return { emoji: '🌫️', label: 'Fog' };
	if (code <= 69) return { emoji: '🌧️', label: 'Rain' };
	if (code <= 79) return { emoji: '🌨️', label: 'Snow/Sleet' };
	if (code <= 99) return { emoji: '⛈️', label: 'Thunderstorm' };
	return { emoji: '🌡️', label: 'Unknown' };
}
