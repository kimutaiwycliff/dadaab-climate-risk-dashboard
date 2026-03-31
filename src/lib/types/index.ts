export interface FIRMSHotspot {
	latitude: number;
	longitude: number;
	brightness: number;
	confidence: 'high' | 'nominal' | 'low';
	acq_date: string;
	acq_time: string;
	satellite: string;
	frp: number;
	daynight: 'D' | 'N';
}

export interface WeatherCurrent {
	temperature_2m: number;
	relative_humidity_2m: number;
	precipitation: number;
	wind_speed_10m: number;
	weather_code: number;
	time: string;
}

export interface WeatherDaily {
	time: string[];
	precipitation_sum: number[];
	et0_fao_evapotranspiration: number[];
	precipitation_probability_max: number[];
}

export interface WeatherData {
	current: WeatherCurrent;
	daily: WeatherDaily;
}

export interface DroughtAssessment {
	deficit_mm: number;
	severity: 'normal' | 'moderate' | 'severe' | 'extreme';
	label: string;
	color: string;
	totalPrecip?: number;
	totalET0?: number;
}

export interface OSMFeature {
	type: 'node' | 'way';
	id: number;
	lat?: number;
	lon?: number;
	center?: { lat: number; lon: number };
	tags: Record<string, string>;
}

export interface Earthquake {
	id: string;
	magnitude: number;
	place: string;
	time: number;
	latitude: number;
	longitude: number;
	depth: number;
}

export interface UNHCRPopulation {
	year: number;
	refugees: number;
	asylum_seekers: number;
	total: number;
}

export interface Camp {
	id: string;
	name: string;
	lat: number;
	lng: number;
	established: number;
	area_km2: number;
	description: string;
}

export interface DroughtZone {
	id: string;
	label: string;
	description: string;
	color: string;
	coordinates: number[][];
}

export interface FloodZone {
	id: string;
	label: string;
	coordinates: number[][];
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
