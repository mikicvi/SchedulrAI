import { useUser } from '@/contexts/UserContext';
import Layout from './Layout';
import { getNotificationColorByType } from '@/services/notificationsUtil';
import { format } from 'date-fns';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';

export default function Notifications() {
	const { notifications, markNotificationAsRead, clearNotifications } = useUser();
	const navigate = useNavigate();

	const handleNotificationClick = (notification: any) => {
		markNotificationAsRead(notification.id);
		if (notification.eventId) {
			navigate(`/calendar?event=${notification.eventId}`);
		}
	};

	const breadcrumbItems = [{ title: 'Notifications', href: '/notifications' }, { title: 'View all notifications' }];

	return (
		<Layout breadcrumbItems={breadcrumbItems}>
			<Card>
				<div className='container mx-auto p-3'>
					<div className='flex justify-between items-center mb-6'>
						<h1 className='text-2xl font-bold flex items-center gap-2'>
							<Bell className='h-6 w-6' />
							Notifications
						</h1>
						<Button variant='outline' onClick={clearNotifications}>
							Clear All
						</Button>
					</div>

					<ScrollArea className='h-[calc(100vh-200px)]'>
						{notifications.length === 0 ? (
							<div className='text-center text-gray-500 py-8'>No notifications</div>
						) : (
							<div className='space-y-4'>
								{notifications.map((notification) => (
									<button
										key={notification.id}
										className={`w-full text-left p-4 rounded-lg border ${getNotificationColorByType(
											notification.type,
											notification.importance
										)} transition-colors ${
											!notification.read ? 'opacity-100' : 'opacity-60'
										} hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary`}
										onClick={() => handleNotificationClick(notification)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												handleNotificationClick(notification);
											}
										}}
									>
										<div className='flex justify-between items-start'>
											<div>
												<h3 className='font-semibold'>{notification.title}</h3>
												<p className='text-sm mt-1'>{notification.message}</p>
											</div>
											<div className='flex items-center gap-2'>
												<span className='text-xs'>
													{format(new Date(notification.timestamp), 'PPp')}
												</span>
												{notification.read ? (
													<Check className='h-4 w-4' />
												) : (
													<X className='h-4 w-4' />
												)}
											</div>
										</div>
									</button>
								))}
							</div>
						)}
					</ScrollArea>
				</div>
			</Card>
		</Layout>
	);
}
