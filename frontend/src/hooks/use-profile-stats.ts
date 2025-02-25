import { useState, useMemo } from 'react';
import { useApi } from './use-Api';
import { formatMonthYear, getChartColors } from '@/lib/utils';

export interface MonthlyEvent {
	count: number;
	month: string;
	fill?: string;
}

export interface ProfileStats {
	totalEvents: number;
	totalCalendars: number;
	joinedDate: string;
	eventsPerMonth: MonthlyEvent[];
}

export function useProfileStats() {
	const { apiFetch } = useApi();
	const [stats, setStats] = useState<ProfileStats>({
		totalEvents: 0,
		totalCalendars: 0,
		joinedDate: '',
		eventsPerMonth: [],
	});

	const chartColors = getChartColors();

	const formattedEventsData = useMemo(() => {
		if (!stats.eventsPerMonth.length) return [];

		const colorKeys = Object.keys(chartColors) as Array<keyof typeof chartColors>;

		return stats.eventsPerMonth.map((event, index) => ({
			...event,
			month: formatMonthYear(event.month),
			fill: chartColors[colorKeys[index % colorKeys.length]],
		}));
	}, [stats.eventsPerMonth, chartColors]);

	const fetchStats = async () => {
		try {
			const response = await apiFetch('/profile/stats');
			if (!response.ok) throw new Error('Failed to fetch user stats');

			const data = await response.json();
			if (data.success) {
				setStats(data.stats);
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			console.error('Failed to fetch user stats:', error);
			throw error;
		}
	};

	return {
		stats,
		formattedEventsData,
		fetchStats,
	};
}
