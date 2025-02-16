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
import React from 'react';
import { Home } from 'lucide-react';

interface LayoutProps {
	children: React.ReactNode;
	breadcrumbItems: Array<{ title: string; href?: string }>;
}

export default function Layout({ children, breadcrumbItems }: LayoutProps) {
	const [open, setOpen] = React.useState(true);
	return (
		<SidebarProvider open={open} onOpenChange={setOpen}>
			<AppSidebar />
			<main className='flex-1 m-0'>
				<div className='flex justify-between items-center p-4'>
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
				<Separator className='mt-0' />
				<div className='p-4'>{children}</div>
			</main>
		</SidebarProvider>
	);
}
