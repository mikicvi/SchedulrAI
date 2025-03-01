import { Event } from '@/types/calendar';
import { format } from 'date-fns';
import { Notification } from '@/contexts/UserContext';

export const getNotificationColorByType = (type: string, importance?: string) => {
	// If it's an event notification, use importance-based coloring
	if (type === 'event') {
		// Convert string importance to Enum for comparison
		switch (importance) {
			case 'UrgentImportant':
				return 'bg-red-50 dark:bg-red-950 border-red-500 text-red-800 dark:text-red-200';
			case 'UrgentNotImportant':
				return 'bg-orange-50 dark:bg-orange-950 border-orange-500 text-orange-800 dark:text-orange-200';
			case 'NotUrgentImportant':
				return 'bg-green-50 dark:bg-green-950 border-green-500 text-green-800 dark:text-green-200';
			case 'NotUrgentNotImportant':
				return 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-800 dark:text-blue-200';
			default:
				return 'bg-gray-50 dark:bg-gray-900 border-gray-500 text-gray-800 dark:text-gray-200';
		}
	}

	// Default notification type coloring
	switch (type) {
		case 'error':
			return 'bg-red-50 dark:bg-red-950 border-red-500 text-red-800 dark:text-red-200';
		case 'warning':
			return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-500 text-yellow-800 dark:text-yellow-200';
		case 'success':
			return 'bg-green-50 dark:bg-green-950 border-green-500 text-green-800 dark:text-green-200';
		default:
			return 'bg-gray-50 dark:bg-gray-900 border-gray-500 text-gray-800 dark:text-gray-200';
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
