import { SidebarMenuButton } from '@/components/ui/sidebar';
import { CheckSquareIcon } from 'lucide-react'; // Make sure to import this
import logo from '@/assets/schedulrAI-white-outline.png';
import { API_BASE_URL } from '@/config/config';

export function SchedulrHeader() {
	return (
		<SidebarMenuButton
			size='lg'
			className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
			variant='outline'
		>
			<div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
				<img src={logo} alt='SchedulrAI Logo' className='size-7' />
			</div>
			<div className='grid flex-1 text-left text-sm leading-tight'>
				<span className='truncate font-semibold'>SchedulrAI</span>
				<span className='truncate text-xs'>
					{API_BASE_URL?.includes('localhost') ? 'Locally Hosted' : `${new URL(API_BASE_URL).host}`}
				</span>
			</div>
			<CheckSquareIcon className='ml-auto' />
		</SidebarMenuButton>
	);
}
