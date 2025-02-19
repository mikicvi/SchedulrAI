import { Event } from '@/types/calendar';
import { useApi } from '@/hooks/use-Api';

export const useCalendarService = () => {
	const { apiFetch } = useApi();
	const baseUrl = 'http://localhost:3000/api';

	const formatEventForBackend = (event: Omit<Event, 'id'>) => ({
		...event,
		startTime: event.start.toISOString(),
		endTime: event.end.toISOString(),
		start: undefined,
		end: undefined,
	});

	const formatEventFromBackend = (event: any): Event => {
		// Handle potential null values and use correct property names
		const startDate = event.startTime ? new Date(event.startTime) : new Date();
		const endDate = event.endTime ? new Date(event.endTime) : new Date();

		return {
			id: event.id?.toString() ?? '', // Handle potential undefined id
			title: event.title ?? '',
			description: event.description ?? '',
			location: event.location ?? '',
			start: startDate,
			end: endDate,
			importance: event.importance ?? undefined,
			calendarId: event.calendarId,
		};
	};

	return {
		// Calendar endpoints
		async createCalendar(calendarData: any) {
			const response = await apiFetch(`${baseUrl}/calendars`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(calendarData),
				credentials: 'include',
			});

			if (!response.ok) throw new Error('Failed to create calendar');
			return response.json();
		},

		async getCalendar(calendarId: number) {
			const response = await apiFetch(`${baseUrl}/calendars/${calendarId}`, {
				credentials: 'include',
			});

			if (!response.ok) throw new Error('Failed to fetch calendar');
			return response.json();
		},

		async updateCalendar(calendarId: number, updates: any) {
			const response = await apiFetch(`${baseUrl}/calendars/${calendarId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updates),
				credentials: 'include',
			});

			if (!response.ok) throw new Error('Failed to update calendar');
			return response.json();
		},

		async deleteCalendar(calendarId: number) {
			const response = await apiFetch(`${baseUrl}/calendars/${calendarId}`, {
				method: 'DELETE',
				credentials: 'include',
			});

			if (!response.ok) throw new Error('Failed to delete calendar');
			return response.json();
		},

		// Event endpoints
		async createEvent(calendarId: number, event: Omit<Event, 'id'>) {
			const formattedEvent = formatEventForBackend(event);
			const response = await apiFetch(`${baseUrl}/events`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...formattedEvent, calendarId }),
				credentials: 'include',
			});

			if (!response.ok) throw new Error('Failed to create event');
			const data = await response.json();
			return { data: formatEventFromBackend(data) };
		},

		async getEvent(eventId: string) {
			const response = await apiFetch(`${baseUrl}/events/${eventId}`, {
				credentials: 'include',
			});

			if (!response.ok) throw new Error('Failed to fetch event');
			const data = await response.json();
			return { data: formatEventFromBackend(data) };
		},

		async getEvents(calendarId: number) {
			const response = await apiFetch(`${baseUrl}/calendars/${calendarId}/events`, {
				credentials: 'include',
			});

			if (!response.ok) throw new Error('Failed to fetch events');
			const responseData = await response.json();

			// Handle the actual data structure from your API
			const events = responseData.data || [];
			return {
				data: events
					.filter((event: { startTime: any; endTime: any }) => event.startTime && event.endTime)
					.map(
						(event: {
							id: { toString: () => any };
							title: any;
							startTime: string | number | Date;
							endTime: string | number | Date;
							description: any;
							location: any;
							importance: any;
							calendarId: any;
						}) => ({
							id: event.id.toString(),
							title: event.title,
							start: new Date(event.startTime),
							end: new Date(event.endTime),
							description: event.description || '',
							location: event.location || '',
							importance: event.importance,
							calendarId: event.calendarId,
						})
					),
			};
		},

		async updateEvent(eventId: string, updates: Partial<Event>) {
			const formattedUpdates = formatEventForBackend(updates as Event);
			const response = await apiFetch(`${baseUrl}/events/${eventId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formattedUpdates),
				credentials: 'include',
			});

			if (!response.ok) throw new Error('Failed to update event');
			const data = await response.json();
			return { data: formatEventFromBackend(data) };
		},

		async deleteEvent(eventId: string) {
			const response = await apiFetch(`${baseUrl}/events/${eventId}`, {
				method: 'DELETE',
				credentials: 'include',
			});

			if (!response.ok) throw new Error('Failed to delete event');
			// Don't try to parse JSON, just return success
			return { success: true };
		},
	};
};
