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
		navigate('/calendar', { state: { autoViewEventId: eventId } });
	}, [navigate, eventId]);

	// Auto-view if we're on the calendar page
	useEffect(() => {
		if (location.pathname === '/calendar') {
			handleViewEvent();
			// Dismiss after a delay to ensure the event is shown
			setTimeout(onDismiss, 1000);
		}
	}, [location.pathname, handleViewEvent, onDismiss]);

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
