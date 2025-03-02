import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import React, { useEffect } from 'react';
import { Home } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { UpcomingEventAlert } from '@/components/UpcomingEventAlert';
import { useActiveAlerts } from '@/hooks/use-active-alerts';
import { playNotificationSound } from '@/services/sound';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { useLocation } from 'react-router-dom';
import { PreferencesDropdownMenuMenu } from '@/components/PreferencesDropdownMenu';

interface LayoutProps {
	children: React.ReactNode;
	breadcrumbItems: Array<{ title: string; href?: string }>;
}

const SIDEBAR_STORAGE_KEY = 'sidebar_expanded';

export default function Layout({ children, breadcrumbItems }: LayoutProps) {
	const { user, addNotification } = useUser();
	const { activeAlerts, addAlert, removeAlert } = useActiveAlerts();
	const [open, setOpen] = React.useState(() => {
		// Initialize from localStorage, default to true if not found
		const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
		return stored ? JSON.parse(stored) : true;
	});

	// Save to localStorage whenever the state changes
	useEffect(() => {
		localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(open));
	}, [open]);

	// Global notification check
	useEffect(() => {
		if (!user) return;

		const checkUpcomingEvents = () => {
			const now = new Date();
			const eventsString = localStorage.getItem(`calendar_events_${user.calendarId}`);
			if (!eventsString) return;

			try {
				const events = JSON.parse(eventsString);
				events.forEach((event: any) => {
					const eventStart = new Date(event.start);
					const timeDiff = eventStart.getTime() - now.getTime();
					const minutesDiff = Math.floor(timeDiff / (1000 * 60));

					if (minutesDiff > 0 && minutesDiff <= 15) {
						const notificationKey = `event-${event.id}-${eventStart.toISOString()}`;
						const hasNotified = sessionStorage.getItem(notificationKey);

						if (!hasNotified) {
							// Add to active alerts
							addAlert({
								id: notificationKey,
								eventId: event.id,
								title: event.title,
								minutesUntil: minutesDiff,
								importance: event.importance,
							});

							playNotificationSound();

							addNotification({
								title: 'Upcoming Event',
								message: `${event.title} starts in ${minutesDiff} minutes`,
								type: 'event',
								eventId: event.id,
								importance: event.importance,
							});

							sessionStorage.setItem(notificationKey, 'true');
						}
					}
				});
			} catch (error) {
				console.error('Error parsing events:', error);
			}
		};

		const interval = setInterval(checkUpcomingEvents, 60000);
		checkUpcomingEvents(); // Initial check
		return () => clearInterval(interval);
	}, [user, addNotification, addAlert]);

	const location = useLocation();

	return (
		<SidebarProvider open={open} onOpenChange={setOpen}>
			<div className='flex h-screen w-full overflow-hidden'>
				<AppSidebar />
				<main className='flex-1 flex flex-col h-screen w-full overflow-hidden'>
					<div className='flex justify-between items-center p-3 shrink-0 w-full'>
						<div className='flex items-center'>
							<SidebarTrigger variant='outline' />
							<Separator orientation='vertical' className='mx-4 h-6' />
							<Breadcrumb>
								<BreadcrumbList>
									<BreadcrumbItem>
										<BreadcrumbLink href='/'>
											<Home className='w-5 h-5' />
										</BreadcrumbLink>
									</BreadcrumbItem>
									<BreadcrumbSeparator />
									{breadcrumbItems.map((item, index) => (
										<React.Fragment key={index}>
											<BreadcrumbItem>
												{item.href ? (
													<BreadcrumbLink href={item.href}>{item.title}</BreadcrumbLink>
												) : (
													<BreadcrumbPage>{item.title}</BreadcrumbPage>
												)}
											</BreadcrumbItem>
											{index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
										</React.Fragment>
									))}
								</BreadcrumbList>
							</Breadcrumb>
						</div>
						<div className='flex items-center gap-2'>
							<NotificationsDropdown />
							<Separator orientation='vertical' className='h-6' />
							<PreferencesDropdownMenuMenu />
						</div>
					</div>
					<Separator className='mt-0 shrink-0' />
					<div className='flex-1 overflow-y-auto w-full'>
						<div className='p-4 w-full'>
							{/* Only show alerts if we're not on the notifications page */}
							{location.pathname !== '/notifications' &&
								activeAlerts.map((alert) => (
									<UpcomingEventAlert
										key={alert.id}
										eventId={alert.eventId}
										title={alert.title}
										minutesUntil={alert.minutesUntil}
										onDismiss={() => removeAlert(alert.id)}
										importance={alert.importance}
									/>
								))}
							{children}
						</div>
					</div>
				</main>
			</div>
		</SidebarProvider>
	);
}
