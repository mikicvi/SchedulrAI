import { Button } from '@/components/ui/button';
import { Event, Importance } from '@/types/calendar';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { enIE } from 'date-fns/locale';
import { Plus, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, SlotInfo, ToolbarProps, View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-style.css';
import '@/index.css';
import { EventDialog } from './event-dialog';
import { EventForm } from './event-form';
import { useUser } from '@/contexts/UserContext';
import { useCalendarService } from '@/services/calendarService';
import { useToast } from '@/hooks/use-toast';

const locales = {
	'en-IE': enIE,
};

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek,
	getDay,
	locales,
});

const getEventStyle = (event: Event) => {
	switch (event.importance) {
		case Importance.UrgentImportant:
			return { backgroundColor: '#ef4444', color: 'white' }; // Red
		case Importance.UrgentNotImportant:
			return { backgroundColor: '#f97316', color: 'white' }; // Orange
		case Importance.NotUrgentImportant:
			return { backgroundColor: '#22c55e', color: 'white' }; // Green
		case Importance.NotUrgentNotImportant:
			return { backgroundColor: '#3b82f6', color: 'white' }; // Blue
		default:
			return { backgroundColor: '#6b7280', color: 'white' }; // Gray
	}
};

export default function CalendarComponent() {
	const { user } = useUser();
	const calendarService = useCalendarService();
	const { toast } = useToast();
	const [events, setEvents] = useState<Event[]>([]);
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	const [showEventDialog, setShowEventDialog] = useState(false);
	const [showEventForm, setShowEventForm] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
	const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>();
	const [isSyncing, setIsSyncing] = useState(false);

	// Add fetchEvents function outside useEffect for reusability
	const fetchEvents = async () => {
		if (!user?.calendarId) return;
		try {
			const response = await calendarService.getEvents(user.calendarId);
			if (response.data) {
				// Filter out events with null dates and format them
				const validEvents = response.data.filter(
					(event: { start: null; end: null }) => event.start !== null && event.end !== null
				);
				setEvents(validEvents);
			}
		} catch (error) {
			console.error('Error fetching events:', error);
			toast({
				title: 'Error',
				description: 'Failed to fetch events',
				variant: 'destructive',
			});
		}
	};

	const handleSyncCalendar = async () => {
		if (!user?.googleUser) return;

		setIsSyncing(true);
		try {
			await calendarService.syncGoogleCalendar(user.id);
			await fetchEvents(); // Refresh events after sync
			toast({
				title: 'Calendar synced',
				description: 'Your calendar has been synced with Google Calendar.',
			});
		} catch (error) {
			toast({
				title: 'Sync failed',
				description: error instanceof Error ? error.message : 'Failed to sync with Google Calendar',
				variant: 'destructive',
			});
		} finally {
			setIsSyncing(false);
		}
	};

	// Add console.log to debug events
	useEffect(() => {
		console.log('Current events:', events);
	}, [events]);

	useEffect(() => {
		fetchEvents();
		// If user has Google account, sync on initial load
		if (user?.googleUser) {
			handleSyncCalendar();
		}
	}, [user?.calendarId]);

	const handleSelectEvent = (event: Event) => {
		setSelectedEvent(event);
		setShowEventDialog(true);
	};

	const handleSelectSlot = (slotInfo: SlotInfo) => {
		setSelectedEvent(null);

		// Ensure we're working with the correct time
		const start = new Date(slotInfo.start);
		let end = new Date(slotInfo.end);

		// For drag selections in month view, adjust the end date
		if (slotInfo.action === 'select' && end.getHours() === 0) {
			end.setDate(end.getDate() - 1);
			end.setHours(23, 59, 0);
		}

		setSelectedSlot(start);
		setSelectedEndDate(end);
		setShowEventForm(true);

		console.log('Selected slot:', {
			start: start.toISOString(),
			end: end.toISOString(),
			action: slotInfo.action,
		});
	};

	const handleAddEvent = () => {
		setSelectedEvent(null);
		setSelectedSlot(new Date());
		setShowEventForm(true);
	};

	const handleSaveEvent = async (eventData: Omit<Event, 'id'>) => {
		try {
			if (!user?.calendarId) {
				throw new Error('No calendar found');
			}

			if (selectedEvent) {
				const updated = await calendarService.updateEvent(selectedEvent.id, eventData);
				setEvents(events.map((event) => (event.id === selectedEvent.id ? updated.data : event)));
			} else {
				const created = await calendarService.createEvent(user.calendarId, eventData);
				setEvents([...events, created.data]);
			}
			await fetchEvents(); // Refresh events after save
			setShowEventForm(false);
			toast({
				title: selectedEvent ? 'Event updated' : 'Event created',
				description: 'Your calendar has been updated successfully.',
			});
		} catch (error) {
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'An unknown error occurred',
				variant: 'destructive',
			});
		}
	};

	const handleDeleteEvent = async () => {
		if (selectedEvent) {
			try {
				await calendarService.deleteEvent(selectedEvent.id);
				// Remove the event from local state
				setEvents(events.filter((event) => event.id !== selectedEvent.id));
				setShowEventDialog(false);
				toast({
					title: 'Event deleted',
					description: 'The event has been removed from your calendar.',
				});
			} catch (error) {
				toast({
					title: 'Error',
					description: error instanceof Error ? error.message : 'An unknown error occurred',
					variant: 'destructive',
				});
			}
		}
	};

	const handleEditEvent = () => {
		setShowEventDialog(false);
		setShowEventForm(true);
	};

	const CustomToolbar: React.FC<ToolbarProps<Event>> = (props) => {
		const { label, onNavigate, onView } = props;

		const handleViewChange = (newView: View) => {
			onView(newView);
		};

		const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
			onNavigate(action);
		};

		return (
			<div className='flex items-center justify-between py-4 border-b'>
				<div className='flex items-center space-x-4'>
					<Button variant='outline' onClick={() => handleNavigate('TODAY')}>
						Today
					</Button>
					<div className='flex items-center space-x-2'>
						<Button variant='outline' onClick={() => handleNavigate('PREV')}>
							Previous
						</Button>
						<Button variant='outline' onClick={() => handleNavigate('NEXT')}>
							Next
						</Button>
					</div>
					<h2 className='text-xl font-semibold'>{label}</h2>
				</div>
				<div className='flex items-center space-x-4'>
					{user?.googleUser && (
						<Button
							onClick={handleSyncCalendar}
							disabled={isSyncing}
							variant='outline'
							className='flex items-center space-x-2'
						>
							<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
							<span>{isSyncing ? 'Syncing...' : 'Sync Google Calendar'}</span>
						</Button>
					)}
					<Button onClick={handleAddEvent} className='flex items-center space-x-2'>
						<Plus className='w-4 h-4' />
						<span>Add Event</span>
					</Button>
					<div className='flex space-x-2'>
						{['month', 'week', 'day'].map((viewType) => (
							<Button key={viewType} variant='outline' onClick={() => handleViewChange(viewType as View)}>
								{viewType.charAt(0).toUpperCase() + viewType.slice(1)}
							</Button>
						))}
					</div>
				</div>
			</div>
		);
	};

	return (
		<div className='h-full w-full px-4'>
			<div className='h-[calc(85vh-3rem)] rounded-lg shadow-sm'>
				<BigCalendar
					localizer={localizer}
					events={events}
					defaultView='month'
					views={['month', 'week', 'day']}
					onSelectEvent={handleSelectEvent}
					onSelectSlot={handleSelectSlot}
					selectable
					selected={selectedSlot}
					dayLayoutAlgorithm='no-overlap'
					scrollToTime={new Date()}
					min={new Date(new Date().setHours(0, 0, 0, 0))}
					max={new Date(new Date().setHours(23, 59, 59, 999))}
					longPressThreshold={250}
					step={30}
					timeslots={2}
					components={{
						toolbar: CustomToolbar,
					}}
					eventPropGetter={(event) => ({
						style: getEventStyle(event),
					})}
					culture='en-IE'
					startAccessor='start'
					endAccessor='end'
				/>
			</div>

			<EventDialog
				event={selectedEvent}
				open={showEventDialog}
				onClose={() => setShowEventDialog(false)}
				onEdit={handleEditEvent}
				onDelete={handleDeleteEvent}
			/>

			<EventForm
				event={selectedEvent}
				open={showEventForm}
				onClose={() => {
					setShowEventForm(false);
					setSelectedEndDate(undefined);
				}}
				onSave={handleSaveEvent}
				selectedDate={selectedSlot ?? undefined}
				selectedEndDate={selectedEndDate}
			/>
		</div>
	);
}
