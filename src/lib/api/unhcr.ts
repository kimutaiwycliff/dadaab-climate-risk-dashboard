import type { UNHCRPopulation } from '$lib/types';

// Actual UNHCR figures for Kenya (country of asylum), used as fallback
const FALLBACK_DATA: UNHCRPopulation[] = [
	{ year: 2019, refugees: 438899, asylum_seekers: 50829, total: 489728 },
	{ year: 2020, refugees: 452916, asylum_seekers: 51916, total: 504832 },
	{ year: 2021, refugees: 481048, asylum_seekers: 59001, total: 540049 },
	{ year: 2022, refugees: 540726, asylum_seekers: 77168, total: 617894 },
	{ year: 2023, refugees: 624980, asylum_seekers: 89543, total: 714523 },
	{ year: 2024, refugees: 670000, asylum_seekers: 95000, total: 765000 }
];

interface UNHCRItem {
	year: number;
	refugees: number | string;
	asylum_seekers: number | string;
	[key: string]: unknown;
}

export async function fetchUNHCRData(): Promise<UNHCRPopulation[]> {
	try {
		// coa=KEN = Country of Asylum is Kenya (refugees hosted in Kenya)
		const response = await fetch(
			'https://api.unhcr.org/population/v1/population/?limit=10&dataset=population&displayType=totals&coa=KEN&yearFrom=2019&yearTo=2024'
		);
		if (!response.ok) throw new Error(`UNHCR API failed: ${response.status}`);

		const data = (await response.json()) as { items?: UNHCRItem[] };
		if (!data.items || data.items.length === 0) return FALLBACK_DATA;

		const parsed = data.items
			.map((item) => {
				const refugees = Number(item.refugees) || 0;
				const asylum_seekers = Number(item.asylum_seekers) || 0;
				return {
					year: Number(item.year),
					refugees,
					asylum_seekers,
					total: refugees + asylum_seekers
				};
			})
			.filter((p) => p.year > 0 && p.total > 0)
			.sort((a, b) => a.year - b.year);

		return parsed.length > 0 ? parsed : FALLBACK_DATA;
	} catch {
		return FALLBACK_DATA;
	}
}
