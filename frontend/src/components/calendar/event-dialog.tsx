import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Event } from '@/types/calendar';
import { format } from 'date-fns';
import { Edit2, Trash2, RefreshCw } from 'lucide-react';

interface EventDialogProps {
	event: Event | null;
	open: boolean;
	onClose: () => void;
	onEdit: () => void;
	onDelete: () => void;
	isDeleting: boolean;
}

export function EventDialog({ event, open, onClose, onEdit, onDelete, isDeleting }: Readonly<EventDialogProps>) {
	if (!event) return null;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle className='text-xl font-semibold'>{event.title}</DialogTitle>
				</DialogHeader>
				<div className='mt-4 space-y-4'>
					<div className='space-y-1'>
						<p className='text-sm font-medium text-gray-500'>Date & Time</p>
						<p className='text-sm'>
							{format(event.start, 'PPPP')}
							<br />
							{format(event.start, 'p')} - {format(event.end, 'p')}
						</p>
					</div>
					{event.location && (
						<div className='space-y-1'>
							<p className='text-sm font-medium text-gray-500'>Location</p>
							<p className='text-sm'>{event.location}</p>
						</div>
					)}
					{event.description && (
						<div className='space-y-1'>
							<p className='text-sm font-medium text-gray-500'>Description</p>
							<p className='text-sm'>{event.description}</p>
						</div>
					)}
					{event.importance && (
						<div className='space-y-1'>
							<p className='text-sm font-medium text-gray-500'>Importance</p>
							<p className='text-sm'>{event.importance.replace(/([A-Z])/g, ' $1').trim()}</p>
						</div>
					)}
				</div>
				<DialogFooter className='mt-6'>
					<div className='flex space-x-2'>
						<Button variant='outline' onClick={onEdit} className='flex items-center space-x-2'>
							<Edit2 className='w-4 h-4' />
							<span>Edit</span>
						</Button>
						<Button
							variant='destructive'
							onClick={onDelete}
							disabled={isDeleting}
							className='flex items-center space-x-2'
						>
							{isDeleting ? (
								<RefreshCw className='w-4 h-4 animate-spin' />
							) : (
								<Trash2 className='w-4 h-4' />
							)}
							<span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
