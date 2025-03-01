import { Event, Importance } from '@/types/calendar';
import { format } from 'date-fns';
import { Notification } from '@/contexts/UserContext';

export const getNotificationColorByType = (type: string) => {
	switch (type) {
		case 'error':
			return 'bg-red-100 border-red-500 text-red-800';
		case 'warning':
			return 'bg-yellow-100 border-yellow-500 text-yellow-800';
		case 'success':
			return 'bg-green-100 border-green-500 text-green-800';
		case 'event':
			return 'bg-blue-100 border-blue-500 text-blue-800';
		default:
			return 'bg-gray-100 border-gray-500 text-gray-800';
	}
};

export const getEventNotificationColor = (importance: Importance) => {
	switch (importance) {
		case Importance.UrgentImportant:
			return 'bg-red-100 border-red-500';
		case Importance.UrgentNotImportant:
			return 'bg-orange-100 border-orange-500';
		case Importance.NotUrgentImportant:
			return 'bg-green-100 border-green-500';
		case Importance.NotUrgentNotImportant:
			return 'bg-blue-100 border-blue-500';
		default:
			return 'bg-gray-100 border-gray-500';
	}
};

export const createEventNotification = (event: Event): Omit<Notification, 'id' | 'timestamp' | 'read'> => {
	return {
		title: 'Upcoming Event',
		message: `${event.title} starts at ${format(new Date(event.start), 'HH:mm')}`,
		type: 'event' as const,
		eventId: event.id,
		importance: event.importance,
	};
};
