import type { RiskLevel } from '$lib/types';

export function riskLevelColor(level: RiskLevel): string {
	switch (level) {
		case 'CRITICAL': return '#ef4444';
		case 'HIGH': return '#f97316';
		case 'MEDIUM': return '#eab308';
		case 'LOW': return '#22c55e';
	}
}

export function riskLevelBg(level: RiskLevel): string {
	switch (level) {
		case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
		case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
		case 'MEDIUM': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
		case 'LOW': return 'bg-green-500/20 text-green-400 border-green-500/30';
	}
}

export function fireCountToRisk(count: number): RiskLevel {
	if (count === 0) return 'LOW';
	if (count <= 5) return 'MEDIUM';
	if (count <= 15) return 'HIGH';
	return 'CRITICAL';
}

export function seismicCountToRisk(count: number): RiskLevel {
	if (count === 0) return 'LOW';
	if (count <= 3) return 'MEDIUM';
	return 'HIGH';
}

export function droughtSeverityToRisk(severity: string): RiskLevel {
	switch (severity) {
		case 'extreme': return 'CRITICAL';
		case 'severe': return 'HIGH';
		case 'moderate': return 'MEDIUM';
		default: return 'LOW';
	}
}

// Score 0-100 → color for risk grid
export function scoreToColor(score: number): string {
	if (score >= 80) return '#8b0000';
	if (score >= 60) return '#ef4444';
	if (score >= 40) return '#f97316';
	if (score >= 20) return '#eab308';
	return '#22c55e';
}
