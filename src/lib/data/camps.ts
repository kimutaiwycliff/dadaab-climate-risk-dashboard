import type { Camp, DroughtZone, FloodZone } from '$lib/types';

export const DADAAB_CAMPS: Camp[] = [
	{
		id: 'dagahaley',
		name: 'Dagahaley',
		lat: 1.7658,
		lng: 40.3289,
		established: 1991,
		area_km2: 10.9,
		description: 'Northernmost camp, established during 1991 Somalia crisis'
	},
	{
		id: 'hagadera',
		name: 'Hagadera',
		lat: 1.6012,
		lng: 40.3738,
		established: 1991,
		area_km2: 13.7,
		description: 'Largest camp by area, south of complex centre'
	},
	{
		id: 'ifo',
		name: 'Ifo',
		lat: 1.7011,
		lng: 40.3562,
		established: 1991,
		area_km2: 9.8,
		description: 'Central camp, original Dadaab settlement'
	},
	{
		id: 'ifo2',
		name: 'Ifo 2',
		lat: 1.6845,
		lng: 40.341,
		established: 2011,
		area_km2: 7.2,
		description: 'Expansion camp opened during 2011 Horn of Africa drought'
	},
	{
		id: 'kambioos',
		name: 'Kambioos',
		lat: 1.722,
		lng: 40.295,
		established: 2011,
		area_km2: 5.1,
		description: 'Westernmost camp, now partially decommissioned'
	}
];

export const DROUGHT_ZONES: DroughtZone[] = [
	{
		id: 'ipc-phase4',
		label: 'IPC Phase 4 — Emergency',
		description: 'Households have large food consumption gaps with high acute malnutrition',
		color: '#cc3300',
		coordinates: [
			[39.8, 1.0],
			[41.0, 1.0],
			[41.0, 2.3],
			[39.8, 2.3],
			[39.8, 1.0]
		]
	},
	{
		id: 'ipc-phase5',
		label: 'IPC Phase 5 — Famine Risk',
		description: 'Households have extreme food consumption gaps or extreme loss of livelihoods',
		color: '#8b0000',
		coordinates: [
			[40.0, 1.2],
			[40.7, 1.2],
			[40.7, 1.8],
			[40.0, 1.8],
			[40.0, 1.2]
		]
	}
];

export const FLOOD_ZONES: FloodZone[] = [
	{
		id: 'lak-dera-main',
		label: 'Lak Dera Seasonal Channel',
		coordinates: [
			[40.2, 1.55],
			[40.28, 1.6],
			[40.32, 1.65],
			[40.38, 1.68],
			[40.45, 1.7],
			[40.5, 1.65],
			[40.45, 1.58],
			[40.38, 1.52],
			[40.3, 1.5],
			[40.22, 1.52],
			[40.2, 1.55]
		]
	},
	{
		id: 'northern-wadi',
		label: 'Northern Seasonal Wadi',
		coordinates: [
			[40.1, 1.8],
			[40.18, 1.85],
			[40.28, 1.88],
			[40.35, 1.85],
			[40.3, 1.78],
			[40.2, 1.75],
			[40.12, 1.78],
			[40.1, 1.8]
		]
	},
	{
		id: 'southern-channel',
		label: 'Southern Drainage Channel',
		coordinates: [
			[40.55, 1.3],
			[40.62, 1.35],
			[40.7, 1.38],
			[40.72, 1.32],
			[40.65, 1.25],
			[40.58, 1.22],
			[40.55, 1.28],
			[40.55, 1.3]
		]
	}
];
