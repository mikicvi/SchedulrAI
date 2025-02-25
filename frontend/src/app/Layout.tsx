import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { ModeToggle } from '@/components/ui/mode-toggle';
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

interface LayoutProps {
	children: React.ReactNode;
	breadcrumbItems: Array<{ title: string; href?: string }>;
}
const SIDEBAR_STORAGE_KEY = 'sidebar_expanded';

export default function Layout({ children, breadcrumbItems }: LayoutProps) {
	const [open, setOpen] = React.useState(() => {
		// Initialize from localStorage, default to true if not found
		const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
		return stored ? JSON.parse(stored) : true;
	});

	// Save to localStorage whenever the state changes
	useEffect(() => {
		localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(open));
	}, [open]);

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
						<ModeToggle />
					</div>
					<Separator className='mt-0 shrink-0' />
					<div className='flex-1 overflow-y-auto w-full'>
						<div className='p-4 w-full'>{children}</div>
					</div>
				</main>
			</div>
		</SidebarProvider>
	);
}
