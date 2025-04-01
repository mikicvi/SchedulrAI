import { Button } from '@/components/ui/button';
import { Event, Importance } from '@/types/calendar';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { enIE } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, SlotInfo, ToolbarProps, View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-style.css';
import '@/index.css';
import { EventDialog } from './event-dialog';
import { EventForm } from './event-form';
import { useUser } from '@/contexts/UserContext';
import { useCalendarService } from '@/services/calendarService';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotificationToast } from '@/hooks/use-notification-toast';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

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
	const location = useLocation();
	const navigate = useNavigate();
	const calendarService = useCalendarService();
	const { toast } = useNotificationToast();
	const [events, setEvents] = useState<Event[]>([]);
	const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
	const [showEventDialog, setShowEventDialog] = useState(false);
	const [showEventForm, setShowEventForm] = useState(false);
	const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
	const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>();
	const [isSyncing, setIsSyncing] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [initialEventData, setInitialEventData] = useState<Omit<Event, 'id'> | undefined>(undefined);
	const [showEmailConfirm, setShowEmailConfirm] = useState(false);
	const [pendingEmailEvent, setPendingEmailEvent] = useState<Omit<Event, 'id'> | null>(null);

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
				// Store events in localStorage for global access
				localStorage.setItem(`calendar_events_${user.calendarId}`, JSON.stringify(validEvents));
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
				title: 'Success',
				description: 'Calendar synced with Google Calendar',
				variant: 'default',
			});
		} catch (error) {
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Failed to sync with Google Calendar',
				variant: 'destructive',
			});
		} finally {
			setIsSyncing(false);
		}
	};

	const handleSelectEvent = (event: Event) => {
		setSelectedEvent(event);
		setShowEventDialog(true);
	};

	const handleSelectSlot = (slotInfo: SlotInfo) => {
		setSelectedEvent(null);

		// Ensure we're working with the correct time
		const start = new Date(slotInfo.start);
		const end = new Date(slotInfo.end);

		// In month view, selection end time will be 00:00 of the next day
		if (end.getHours() === 0 && end.getMinutes() === 0) {
			// Adjust the end date to be 23:59 of the previous day
			end.setTime(end.getTime() - 60000); // Subtract one minute from midnight
		}

		// Set the selected dates
		setSelectedSlot(start);
		setSelectedEndDate(end);
		setShowEventForm(true);
	};

	const handleAddEvent = () => {
		setSelectedEvent(null);
		setSelectedSlot(new Date());
		setShowEventForm(true);
	};

	const handleSaveEvent = async (eventData: Omit<Event, 'id'>) => {
		setIsCreating(true);
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

			await fetchEvents();
			setShowEventForm(false);
			toast({
				title: 'Success',
				description: selectedEvent ? 'Event updated successfully' : 'Event created successfully',
				variant: 'default',
			});

			// Set the pending email event with the saved event data
			if (user?.googleUser && !selectedEvent && eventData.customerEmail) {
				setPendingEmailEvent(eventData);

				setShowEmailConfirm(true);
			}
		} catch (error) {
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'An unknown error occurred',
				variant: 'destructive',
			});
		} finally {
			setIsCreating(false);
		}
	};

	const handleDeleteEvent = async () => {
		if (selectedEvent) {
			setIsDeleting(true);
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
			} finally {
				setIsDeleting(false);
			}
		}
	};

	const handleEditEvent = () => {
		setShowEventDialog(false);
		setShowEventForm(true);
	};

	const handleEmailConfirm = () => {
		if (pendingEmailEvent) {
			const emailSubject = `Event Scheduled: ${pendingEmailEvent.title}`;
			const emailTo = pendingEmailEvent.customerEmail ?? '';
			const emailBody = `
			Event: ${pendingEmailEvent.title}
			Date: ${format(pendingEmailEvent.start, 'PPP')}
			Time: ${format(pendingEmailEvent.start, 'p')} - ${format(pendingEmailEvent.end, 'p')}
			${pendingEmailEvent.location ? `Location: ${pendingEmailEvent.location}` : ''}
			${pendingEmailEvent.description || ''}
            `.trim();

			navigate(
				`/sendMail?subject=${encodeURIComponent(emailSubject)}&to=${encodeURIComponent(
					emailTo
				)}&body=${encodeURIComponent(emailBody)}`,
				{
					state: null,
				}
			);
		}
	};

	useEffect(() => {
		const state = location.state as { showEventForm: boolean; eventData: Omit<Event, 'id'> };
		if (state?.showEventForm) {
			// Store the event data
			setInitialEventData(state.eventData);
			setSelectedSlot(state.eventData.start);
			setSelectedEndDate(state.eventData.end);
			setShowEventForm(true);

			// Clear the location state
			navigate(location.pathname, { replace: true });
		}
	}, [location.state]);

	// Handle url query params for auto-viewing events from notifications
	useEffect(() => {
		const state = location.state as { viewEventId?: string; autoViewEventId?: string };
		const params = new URLSearchParams(location.search);
		const eventId = params.get('event') || state?.viewEventId || state?.autoViewEventId;

		if (eventId && events.length > 0) {
			const event = events.find((e) => e.id === eventId);
			if (event) {
				setSelectedEvent(event);
				setShowEventDialog(true);
				// Clean up by replacing the current history entry
				navigate('/calendar', { replace: true });
			}
		}
	}, [events]); // Only depend on events array to prevent loops

	// Separate effect for initial data fetch
	useEffect(() => {
		let mounted = true;

		const init = async () => {
			await fetchEvents();
			// If user has Google account, sync on initial load
			if (mounted && user?.googleUser) {
				await handleSyncCalendar();
			}
		};

		init();

		return () => {
			mounted = false;
		};
	}, [user?.calendarId]);

	const CustomToolbar: React.FC<ToolbarProps<Event>> = (props) => {
		const { label, onNavigate, onView } = props;

		const handleViewChange = (newView: View) => {
			onView(newView);
		};

		const handleNavigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
			onNavigate(action);
		};

		return (
			<div className='flex flex-col gap-4 py-4 border-b sm:flex-row sm:items-center sm:justify-between'>
				{/* Navigation Group */}
				<div className='flex flex-wrap items-center gap-4'>
					<div className='flex items-center gap-2'>
						<Button variant='outline' onClick={() => handleNavigate('TODAY')}>
							Today
						</Button>
						<div className='flex items-center gap-2'>
							<Button variant='outline' onClick={() => handleNavigate('PREV')}>
								<ChevronLeft className='w-4 h-4' />
							</Button>
							<Button variant='outline' onClick={() => handleNavigate('NEXT')}>
								<ChevronRight className='w-4 h-4' />
							</Button>
						</div>
					</div>
					<h2 className='text-xl font-semibold'>{label}</h2>
				</div>

				{/* Actions Group */}
				<div className='flex flex-wrap items-center gap-4'>
					<div className='flex flex-wrap items-center gap-2'>
						{user?.googleUser && (
							<Button
								onClick={handleSyncCalendar}
								disabled={isSyncing}
								variant='outline'
								className='flex items-center gap-2'
							>
								<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
								<span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
							</Button>
						)}
						<Button onClick={handleAddEvent} className='flex items-center gap-2'>
							<Plus className='w-4 h-4' />
							<span>Add Event</span>
						</Button>
					</div>
					<div className='flex gap-2'>
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
				isDeleting={isDeleting}
			/>

			<EventForm
				event={selectedEvent}
				open={showEventForm}
				onClose={() => {
					setShowEventForm(false);
					setSelectedEndDate(undefined);
					setInitialEventData(undefined); // Clear initial data on close
				}}
				onSave={handleSaveEvent}
				selectedDate={selectedSlot ?? undefined}
				selectedEndDate={selectedEndDate}
				isCreating={isCreating}
				initialData={initialEventData} // Pass the stored initial data
			/>

			<ConfirmationDialog
				open={showEmailConfirm}
				onOpenChange={setShowEmailConfirm}
				title='Send Email Notification'
				description='Would you like to send an email notification about this event?'
				confirmText='Send Email'
				cancelText='Skip'
				onConfirm={handleEmailConfirm}
				onCancel={() => setPendingEmailEvent(null)}
			/>
		</div>
	);
}
