import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import { getNotificationColorByType } from '@/services/notificationsUtil';
import { Importance } from '@/types/calendar';

interface UpcomingEventAlertProps {
	eventId: string;
	title: string;
	minutesUntil: number;
	onDismiss: () => void;
	importance?: Importance;
}

export function UpcomingEventAlert({
	eventId,
	title,
	minutesUntil,
	onDismiss,
	importance,
}: Readonly<UpcomingEventAlertProps>) {
	const navigate = useNavigate();
	const location = useLocation();

	const handleViewEvent = useCallback(() => {
		// Use state object instead of search params to avoid URL changes
		navigate('/calendar', { state: { viewEventId: eventId }, replace: true });
	}, [navigate, eventId]);

	// Only auto-view if we're on the calendar page and this is the first render
	useEffect(() => {
		let mounted = true;
		if (location.pathname === '/calendar' && mounted) {
			handleViewEvent();
			// Dismiss after a delay to ensure the event is shown
			const timer = setTimeout(onDismiss, 1000);
			return () => {
				mounted = false;
				clearTimeout(timer);
			};
		}
	}, []);

	return (
		<Alert className={`mb-4 ${getNotificationColorByType('event', importance)}`}>
			<Bell className='h-4 w-4' />
			<AlertTitle>Upcoming Event</AlertTitle>
			<AlertDescription className='flex items-center justify-between mt-2'>
				<span>{`${title} starts in ${minutesUntil} minutes`}</span>
				<div className='flex gap-2'>
					<Button variant='outline' size='sm' onClick={handleViewEvent}>
						View
					</Button>
					<Button variant='ghost' size='sm' onClick={onDismiss}>
						Dismiss
					</Button>
				</div>
			</AlertDescription>
		</Alert>
	);
}
