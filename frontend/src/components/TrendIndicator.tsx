import { TrendingDown, TrendingUp } from 'lucide-react';
import { MonthlyEvent } from '@/hooks/use-profile-stats';

interface TrendIndicatorProps {
	eventsPerMonth: MonthlyEvent[];
}

export function TrendIndicator({ eventsPerMonth }: TrendIndicatorProps) {
	if (eventsPerMonth.length < 2) return null;

	const currentMonth = eventsPerMonth[eventsPerMonth.length - 1];
	const previousMonth = eventsPerMonth[eventsPerMonth.length - 2];

	const trend = ((currentMonth.count - previousMonth.count) / previousMonth.count) * 100;

	if (trend > 0) {
		return (
			<div className='flex items-center gap-2 font-medium leading-none'>
				Trending up by {trend.toFixed(1)}% this month <TrendingUp className='h-4 w-4' />
			</div>
		);
	}

	return (
		<div className='flex items-center gap-2 font-medium leading-none'>
			Trending down by {Math.abs(trend).toFixed(1)}% this month <TrendingDown className='h-4 w-4' />
		</div>
	);
}
