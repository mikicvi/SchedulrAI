import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
	className?: string;
}

export function SkeletonCard({ className }: Readonly<SkeletonCardProps>) {
	return (
		<div className={cn('flex flex-col space-y-4 w-full max-w-[1200px] pt-6', className)}>
			<Skeleton className='h-[200px] w-full rounded-xl' />
			<div className='space-y-3 w-full'>
				<Skeleton className='h-6 w-full' />
				<Skeleton className='h-6 w-[85%]' />
			</div>
		</div>
	);
}
