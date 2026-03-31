import type { FIRMSHotspot } from '$lib/types';

const DADAAB_BBOX = '39.5,0.8,41.2,2.5';

const FALLBACK_HOTSPOTS: FIRMSHotspot[] = [
	{ latitude: 1.85, longitude: 39.95, brightness: 310, confidence: 'high', acq_date: '2026-03-28', acq_time: '0730', satellite: 'N', frp: 8.2, daynight: 'D' },
	{ latitude: 1.92, longitude: 40.12, brightness: 325, confidence: 'nominal', acq_date: '2026-03-28', acq_time: '0730', satellite: 'N', frp: 12.1, daynight: 'D' },
	{ latitude: 2.05, longitude: 40.33, brightness: 298, confidence: 'low', acq_date: '2026-03-29', acq_time: '1015', satellite: 'N', frp: 5.4, daynight: 'D' },
	{ latitude: 1.78, longitude: 40.55, brightness: 340, confidence: 'high', acq_date: '2026-03-29', acq_time: '0730', satellite: 'N', frp: 18.7, daynight: 'D' },
	{ latitude: 1.65, longitude: 40.68, brightness: 305, confidence: 'nominal', acq_date: '2026-03-30', acq_time: '0730', satellite: 'N', frp: 7.3, daynight: 'D' },
	{ latitude: 1.45, longitude: 40.72, brightness: 315, confidence: 'high', acq_date: '2026-03-30', acq_time: '0730', satellite: 'N', frp: 9.8, daynight: 'N' },
	{ latitude: 1.30, longitude: 40.50, brightness: 288, confidence: 'low', acq_date: '2026-03-27', acq_time: '1215', satellite: 'N', frp: 4.1, daynight: 'D' },
	{ latitude: 1.20, longitude: 40.35, brightness: 330, confidence: 'high', acq_date: '2026-03-27', acq_time: '0730', satellite: 'N', frp: 14.5, daynight: 'D' },
	{ latitude: 1.38, longitude: 40.18, brightness: 302, confidence: 'nominal', acq_date: '2026-03-26', acq_time: '0730', satellite: 'N', frp: 6.9, daynight: 'D' },
	{ latitude: 1.55, longitude: 39.88, brightness: 318, confidence: 'high', acq_date: '2026-03-26', acq_time: '0730', satellite: 'N', frp: 11.2, daynight: 'D' },
	{ latitude: 2.10, longitude: 39.90, brightness: 295, confidence: 'low', acq_date: '2026-03-25', acq_time: '1015', satellite: 'N', frp: 3.8, daynight: 'D' },
	{ latitude: 2.18, longitude: 40.22, brightness: 345, confidence: 'high', acq_date: '2026-03-25', acq_time: '0730', satellite: 'N', frp: 21.3, daynight: 'D' },
	{ latitude: 1.95, longitude: 40.78, brightness: 308, confidence: 'nominal', acq_date: '2026-03-24', acq_time: '0730', satellite: 'N', frp: 8.7, daynight: 'N' },
	{ latitude: 1.10, longitude: 40.62, brightness: 322, confidence: 'high', acq_date: '2026-03-24', acq_time: '0730', satellite: 'N', frp: 13.4, daynight: 'D' },
	{ latitude: 1.72, longitude: 40.82, brightness: 299, confidence: 'low', acq_date: '2026-03-23', acq_time: '0730', satellite: 'N', frp: 5.1, daynight: 'D' }
];

function parseCSV(csv: string): FIRMSHotspot[] {
	const lines = csv.trim().split('\n');
	if (lines.length < 2) return [];

	const headers = lines[0].split(',').map((h) => h.trim());
	return lines
		.slice(1)
		.map((line) => {
			const values = line.split(',');
			const row = Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim() ?? '']));

			const confidence = row.confidence?.toLowerCase();
			const validConfidence = ['high', 'nominal', 'low'].includes(confidence)
				? (confidence as FIRMSHotspot['confidence'])
				: 'nominal';

			return {
				latitude: parseFloat(row.latitude),
				longitude: parseFloat(row.longitude),
				brightness: parseFloat(row.bright_ti4 || row.brightness || '0'),
				confidence: validConfidence,
				acq_date: row.acq_date || '',
				acq_time: row.acq_time || '',
				satellite: row.satellite || '',
				frp: parseFloat(row.frp || '0'),
				daynight: (row.daynight === 'N' ? 'N' : 'D') as 'D' | 'N'
			};
		})
		.filter((h) => !isNaN(h.latitude) && !isNaN(h.longitude));
}

export async function fetchFIRMSHotspots(
	apiKey: string,
	days = 7
): Promise<{ hotspots: FIRMSHotspot[]; isDemo: boolean }> {
	if (!apiKey || apiKey === 'demo' || apiKey === '') {
		return { hotspots: FALLBACK_HOTSPOTS, isDemo: true };
	}

	const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/VIIRS_SNPP_NRT/${DADAAB_BBOX}/${days}`;

	try {
		const response = await fetch(url);
		if (!response.ok) throw new Error(`FIRMS API error: ${response.status}`);
		const csv = await response.text();
		const hotspots = parseCSV(csv);
		return { hotspots: hotspots.length > 0 ? hotspots : FALLBACK_HOTSPOTS, isDemo: hotspots.length === 0 };
	} catch {
		return { hotspots: FALLBACK_HOTSPOTS, isDemo: true };
	}
}
