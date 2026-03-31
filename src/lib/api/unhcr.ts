import type { UNHCRPopulation } from '$lib/types';

const FALLBACK_DATA: UNHCRPopulation[] = [
	{ year: 2019, refugees: 467167, asylum_seekers: 20148, total: 487315 },
	{ year: 2020, refugees: 533438, asylum_seekers: 25896, total: 559334 },
	{ year: 2021, refugees: 542490, asylum_seekers: 27315, total: 569805 },
	{ year: 2022, refugees: 589753, asylum_seekers: 39812, total: 629565 },
	{ year: 2023, refugees: 647430, asylum_seekers: 52341, total: 699771 },
	{ year: 2024, refugees: 695000, asylum_seekers: 58000, total: 753000 }
];

export async function fetchUNHCRData(): Promise<UNHCRPopulation[]> {
	try {
		const response = await fetch(
			'https://api.unhcr.org/population/v1/population/?limit=10&dataset=population&displayType=totals&location=KEN&yearFrom=2019&yearTo=2024&type=REF'
		);
		if (!response.ok) throw new Error('UNHCR API failed');

		const data = (await response.json()) as { items?: Record<string, string>[] };

		if (!data.items || data.items.length === 0) return FALLBACK_DATA;

		const parsed = (data.items as Record<string, string>[])
			.map((item) => ({
				year: parseInt(item.year ?? '0'),
				refugees: parseInt(item.REF ?? item.refugees ?? '0'),
				asylum_seekers: parseInt(item.ASY ?? item.asylum_seekers ?? '0'),
				total: parseInt(item.REF ?? '0') + parseInt(item.ASY ?? '0')
			}))
			.filter((p) => p.year > 0)
			.sort((a, b) => a.year - b.year);

		return parsed.length > 0 ? parsed : FALLBACK_DATA;
	} catch {
		return FALLBACK_DATA;
	}
}
