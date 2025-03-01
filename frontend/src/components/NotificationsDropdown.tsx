import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
	DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Bell, BellDot, ChevronRight } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { ScrollArea } from './ui/scroll-area';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { getNotificationColorByType } from '@/services/notificationsUtil';
import '../index.css';

export function NotificationsDropdown() {
	const { notifications, markNotificationAsRead, clearNotifications } = useUser();
	const navigate = useNavigate();
	const unreadCount = notifications.filter((n) => !n.read).length;
	const recentNotifications = notifications.slice(0, 5); // Show only 5 most recent

	const handleNotificationClick = (notification: any) => {
		markNotificationAsRead(notification.id);
		if (notification.eventId) {
			navigate(`/calendar?event=${notification.eventId}`);
		}
	};

	const viewAllNotifications = () => {
		navigate('/notifications');
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='ghost' size='icon' className='relative'>
					{unreadCount > 0 ? <BellDot className='h-5 w-5' /> : <Bell className='h-5 w-5' />}
					{unreadCount > 0 && (
						<span className='absolute -top-1 -right-1 w-5 h-5 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs animate-pulse'>
							{unreadCount}
						</span>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='end' className='w-80'>
				<div className='flex items-center justify-between px-2 py-2'>
					<DropdownMenuLabel>Notifications</DropdownMenuLabel>
					{notifications.length > 0 && (
						<Button
							variant='ghost'
							size='sm'
							onClick={(e) => {
								e.preventDefault();
								clearNotifications();
							}}
							className='h-auto px-2 text-xs text-muted-foreground hover:text-foreground'
						>
							Clear all
						</Button>
					)}
				</div>
				<DropdownMenuSeparator />
				<ScrollArea className='h-[300px]'>
					{notifications.length === 0 ? (
						<div className='text-center py-4 text-muted-foreground'>No notifications</div>
					) : (
						recentNotifications.map((notification) => (
							<DropdownMenuItem
								key={notification.id}
								onClick={() => handleNotificationClick(notification)}
								className={`${getNotificationColorByType(notification.type, notification.importance)}`}
							>
								<div className='flex flex-col gap-1 w-full'>
									<div className='flex justify-between'>
										<span className='font-medium'>{notification.title}</span>
										{!notification.read && <span className='h-2 w-2 bg-primary rounded-full' />}
									</div>
									<span className='text-sm text-muted-foreground'>{notification.message}</span>
									<span className='text-xs text-muted-foreground'>
										{format(new Date(notification.timestamp), 'PP p')}
									</span>
								</div>
							</DropdownMenuItem>
						))
					)}
				</ScrollArea>
				<DropdownMenuSeparator />
				<DropdownMenuItem onSelect={viewAllNotifications} className='w-full'>
					<div className='flex justify-between items-center w-full'>
						View all notifications
						<ChevronRight className='h-4 w-4' />
					</div>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
