import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EventsPieChart } from './EventsPieChart';
import { TrendIndicator } from './TrendIndicator';
import { ProfileStats } from '@/hooks/use-profile-stats';

interface AccountOverviewProps {
	stats: ProfileStats;
	formattedEventsData: Array<{ month: string; count: number; fill?: string }>;
	hasGoogleAccount?: boolean;
}

export function AccountOverview({ stats, formattedEventsData, hasGoogleAccount }: AccountOverviewProps) {
	const StatItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
		<div>
			<p className='text-sm text-muted-foreground'>{label}</p>
			<p className='font-medium'>{value}</p>
		</div>
	);

	return (
		<Card>
			<CardHeader>
				<h2 className='text-2xl font-bold'>Account Overview</h2>
			</CardHeader>
			<CardContent className='space-y-4'>
				<div className='grid grid-cols-2 gap-1'>
					<div className='space-y-2'>
						<StatItem
							label='Member since'
							value={stats.joinedDate ? new Date(stats.joinedDate).toLocaleDateString() : 'N/A'}
						/>
						<StatItem label='Total Events' value={stats.totalEvents} />
						<StatItem label='Total Calendars' value={stats.totalCalendars} />
					</div>
					<div>{hasGoogleAccount && <StatItem label='Google Account Linked' value='Yes' />}</div>
				</div>
				{stats.eventsPerMonth.length > 0 && (
					<EventsPieChart
						data={formattedEventsData}
						title='Events per Month'
						footerContent={
							<>
								{stats.eventsPerMonth.length > 1 && (
									<TrendIndicator eventsPerMonth={stats.eventsPerMonth} />
								)}
								<div className='leading-none text-muted-foreground'>
									Showing total events for the last {stats.eventsPerMonth.length} month
									{stats.eventsPerMonth.length > 1 ? 's' : ''}
								</div>
							</>
						}
					/>
				)}
			</CardContent>
		</Card>
	);
}
