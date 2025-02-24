import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Event, Importance } from '@/types/calendar';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Save } from 'lucide-react';

interface EventFormProps {
	event?: Event | null;
	open: boolean;
	onClose: () => void;
	onSave: (event: Omit<Event, 'id'>) => void;
	selectedDate?: Date;
	selectedEndDate?: Date; //prop for multiple date selection
	isCreating: boolean;
	initialData?: Omit<Event, 'id'>;
}

const defaultFormData = {
	title: '',
	description: '',
	location: '',
	startDate: '',
	startTime: '00:00',
	endDate: '',
	endTime: '23:59',
	importance: undefined as Importance | undefined,
	customerEmail: '',
};

export function EventForm({
	event,
	open,
	onClose,
	onSave,
	selectedDate,
	selectedEndDate,
	isCreating,
	initialData,
}: Readonly<EventFormProps>) {
	const [formData, setFormData] = useState(defaultFormData);

	useEffect(() => {
		if (!open) {
			// Reset form when dialog closes
			setFormData(defaultFormData);
			return;
		}

		if (event) {
			// Use event info even if importance is undefined
			setFormData({
				title: event.title,
				description: event.description || '',
				location: event.location || '',
				startDate: format(event.start, 'yyyy-MM-dd'),
				startTime: format(event.start, 'HH:mm'),
				endDate: format(event.end, 'yyyy-MM-dd'),
				endTime: format(event.end, 'HH:mm'),
				importance: event.importance || undefined, // This can be undefined if not set
				customerEmail: event.customerEmail || '',
			});
		} else if (initialData) {
			// Handle pre-filled data from estimation
			setFormData({
				title: initialData.title,
				description: initialData.description || '',
				location: initialData.location || '',
				startDate: format(initialData.start, 'yyyy-MM-dd'),
				startTime: format(initialData.start, 'HH:mm'),
				endDate: format(initialData.end, 'yyyy-MM-dd'),
				endTime: format(initialData.end, 'HH:mm'),
				importance: initialData.importance || Importance.NotUrgentImportant,
				customerEmail: initialData.customerEmail || '',
			});
		} else if (selectedDate) {
			// Set form data for new event
			const startDate = format(selectedDate, 'yyyy-MM-dd');
			const startTime = format(selectedDate, 'HH:mm');
			const endDate = selectedEndDate ? format(selectedEndDate, 'yyyy-MM-dd') : startDate;
			const endTime = selectedEndDate ? format(selectedEndDate, 'HH:mm') : '23:59';

			setFormData({
				...defaultFormData,
				startDate,
				startTime,
				endDate,
				endTime,
			});
		}
	}, [event, selectedDate, selectedEndDate, open, initialData]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		const start = new Date(`${formData.startDate}T${formData.startTime}`);
		const end = new Date(`${formData.endDate}T${formData.endTime}`);

		onSave({
			title: formData.title,
			description: formData.description,
			location: formData.location,
			start,
			end,
			importance: formData.importance,
			customerEmail: formData.customerEmail,
		});
		onClose();
	};

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className='sm:max-w-[500px]'>
				<DialogHeader>
					<DialogTitle className='text-xl'>{event ? 'Edit Event' : 'Create New Event'}</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='space-y-6 mt-4'>
					<div className='space-y-2'>
						<Label htmlFor='title'>Event Title</Label>
						<Input
							id='title'
							value={formData.title}
							onChange={(e) => setFormData({ ...formData, title: e.target.value })}
							className='w-full'
							placeholder='Enter event title'
							required
						/>
					</div>

					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label>Start Date</Label>
							<div className='space-y-2'>
								<Input
									type='date'
									value={formData.startDate}
									onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
									required
								/>
								<Input
									type='time'
									value={formData.startTime}
									onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
									required
								/>
							</div>
						</div>
						<div className='space-y-2'>
							<Label>End Date</Label>
							<div className='space-y-2'>
								<Input
									type='date'
									value={formData.endDate}
									onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
									required
								/>
								<Input
									type='time'
									value={formData.endTime}
									onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
									required
								/>
							</div>
						</div>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='location'>Location (Optional)</Label>
						<Input
							id='location'
							value={formData.location}
							onChange={(e) => setFormData({ ...formData, location: e.target.value })}
							placeholder='Enter location'
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='description'>Description (Optional)</Label>
						<Textarea
							id='description'
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							rows={3}
							placeholder='Add description'
						/>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='importance'>Importance</Label>
						<Select
							value={formData.importance}
							onValueChange={(value) => setFormData({ ...formData, importance: value as Importance })}
						>
							<SelectTrigger>
								<SelectValue placeholder='Select importance' />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={Importance.UrgentImportant}>Urgent & Important</SelectItem>
								<SelectItem value={Importance.UrgentNotImportant}>Urgent & Not Important</SelectItem>
								<SelectItem value={Importance.NotUrgentImportant}>Not Urgent & Important</SelectItem>
								<SelectItem value={Importance.NotUrgentNotImportant}>
									Not Urgent & Not Important
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className='flex justify-end space-x-2'>
						<Button type='button' variant='outline' onClick={onClose}>
							Cancel
						</Button>
						<Button type='submit' disabled={isCreating} className='flex items-center space-x-2'>
							{isCreating ? <RefreshCw className='w-4 h-4 animate-spin' /> : <Save className='w-4 h-4' />}
							<span>{isCreating ? 'Saving...' : 'Save Event'}</span>
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
