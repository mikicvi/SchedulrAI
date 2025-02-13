import { Calendar, BotIcon, Home, Mail, UserRoundCogIcon, MessageCircleHeart, LifeBuoy } from 'lucide-react';
import { SchedulrHeader } from './ui/sched-header';
import { UserProfile } from './ui/user-profile';
import { useUser } from '@/contexts/UserContext';
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarHeader,
	SidebarFooter,
} from '@/components/ui/sidebar';
import { NavSecondary } from './ui/nav-secondary';
import { useLocation } from 'react-router-dom';

// Menu items.
const items = [
	{
		title: 'Home',
		url: '/',
		icon: Home,
	},
	{
		title: 'Calendar',
		url: '/calendar',
		icon: Calendar,
	},
	{
		title: 'Send Mail',
		url: '/sendMail',
		icon: Mail,
	},
	{
		title: 'Chat with your documents',
		url: '/documentsChat',
		icon: BotIcon,
	},
];

const helpItems = [
	{
		title: 'Support',
		url: 'mailto:vilim.mikic@gmail.com',
		icon: LifeBuoy,
	},
	{
		title: 'Feeback',
		url: 'mailto:vilim.mikic@gmail.com',
		icon: MessageCircleHeart,
	},
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { user } = useUser();
	const location = useLocation();

	return (
		<Sidebar collapsible='icon' {...props}>
			<SidebarHeader className='pt-3'>
				<SchedulrHeader />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Application</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild isActive={location.pathname === item.url}>
										<a href={item.url}>
											<item.icon />
											<span>{item.title}</span>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
				<NavSecondary items={helpItems} className='mt-auto' />
			</SidebarContent>
			<SidebarFooter>
				<UserProfile
					user={{
						name: `${user?.firstName} ${user?.lastName}`.trim() || 'User',
						email: user?.email || 'email@sample.com',
						avatar: user?.initials || UserRoundCogIcon,
					}}
				/>
			</SidebarFooter>
		</Sidebar>
	);
}
