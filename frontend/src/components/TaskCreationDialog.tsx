import { EstimationResponse } from '@/types/estimation';
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Event } from '@/types/calendar';
import { addHours, addMinutes, format, setHours, setMinutes } from 'date-fns';
import { TimePickerForm } from '@/components/time-picker';

interface ConfirmationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	estimatedData: EstimationResponse;
	selectedDate: Date;
	selectedTime: string;
	onConfirm: (eventData: Omit<Event, 'id'>) => void;
}

export function ConfirmationDialog({
	open,
	onOpenChange,
	estimatedData,
	selectedDate,
	selectedTime,
	onConfirm,
}: Readonly<ConfirmationDialogProps>) {
	const generateDefaultTitle = (data: EstimationResponse) => {
		if (!data.taskSummary && !data.customerName) return 'SchedulrAI automated event';

		const prefix = data.customerName ? `[${data.customerName}] ` : '';
		const summary = data.taskSummary ? data.taskSummary.split(' ').slice(0, 5).join(' ') : '';

		return `${prefix}${summary}`.trim();
	};

	const [formData, setFormData] = useState({
		title: '',
		duration: '',
		startTime: '09:00',
		customerEmail: '',
	});

	useEffect(() => {
		if (open && estimatedData) {
			const isValidTimeFormat = (time: string) => {
				return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
			};

			// Determine start time: prefer AI suggestion if valid, fallback to selected time
			const suggestedTime = estimatedData.preferredTimeOfDay;
			const startTime = isValidTimeFormat(suggestedTime as string) ? suggestedTime : selectedTime;

			setFormData({
				title: generateDefaultTitle(estimatedData),
				duration: estimatedData.suggestedTime,
				startTime: startTime as string,
				customerEmail: estimatedData.customerEmail || '',
			});
		}
	}, [open, estimatedData, selectedTime]);

	const handleConfirm = () => {
		// Parse start time and create full start date
		const [hours, minutes] = formData.startTime.split(':').map(Number);
		const startDate = setMinutes(setHours(selectedDate, hours), minutes);

		// Calculate end time based on duration
		const [durationHours, durationMinutes] = formData.duration.split('.').map(Number);
		const endDate = addMinutes(addHours(startDate, durationHours), durationMinutes || 0);

		const eventData: Omit<Event, 'id'> = {
			title: formData.title,
			start: startDate,
			end: endDate,
			customerEmail: formData.customerEmail,
			description: `Created from AI estimation:
            Estimated duration: ${formData.duration} hours
            ${estimatedData.customerName ? `Client: ${estimatedData.customerName}` : ''}
			${estimatedData.customerEmail ? `Client email: ${estimatedData.customerEmail}` : ''}
            ${estimatedData.preferredDay ? `Preferred day: ${estimatedData.preferredDay}` : ''}
            ${estimatedData.preferredTimeOfDay ? `Preferred time: ${estimatedData.preferredTimeOfDay}` : ''},
            ${estimatedData.taskSummary ? `Task summary: ${estimatedData.taskSummary}` : ''},
            ${estimatedData.originalPrompt ? `Original prompt: ${estimatedData.originalPrompt}` : ''}`,
		};

		onConfirm(eventData);
		onOpenChange(false);
	};

	const handleTimeSelect = (time: string) => {
		setFormData((prev) => ({ ...prev, startTime: time }));
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Confirm Scheduling Details</AlertDialogTitle>
					<AlertDialogDescription className='text-destructive'>
						Review and adjust the scheduling details before creating the event.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className='grid gap-4 py-4'>
					<div className='grid grid-cols-4 items-center gap-4'>
						<Label htmlFor='title' className='text-right'>
							Title
						</Label>
						<Input
							id='title'
							value={formData.title}
							onChange={(e) => setFormData({ ...formData, title: e.target.value })}
							className='col-span-3'
						/>
					</div>

					<div className='grid grid-cols-4 items-center gap-4'>
						<Label className='text-right'>Start Time</Label>
						<div className='col-span-3'>
							<TimePickerForm
								selected={formData.startTime}
								onSelect={handleTimeSelect}
								className='max-w-full'
								showLabel={false}
							/>
						</div>
					</div>

					<div className='grid grid-cols-4 items-center gap-4'>
						<Label htmlFor='duration' className='text-right'>
							Duration (H.MM)
						</Label>
						<Input
							id='duration'
							value={formData.duration}
							onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
							className='col-span-3'
							readOnly
						/>
					</div>

					<div className='grid grid-cols-4 items-center gap-4'>
						<Label htmlFor='customerEmail' className='text-right'>
							Customer Email
						</Label>
						<Input
							id='customerEmail'
							value={formData.customerEmail}
							onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
							className='col-span-3'
						/>
					</div>

					{estimatedData.preferredDay && (
						<div className='grid grid-cols-4 items-center gap-4'>
							<Label className='text-right text-muted-foreground'>Preferred Day</Label>
							<div className='col-span-3 text-muted-foreground'>{estimatedData.preferredDay}</div>
						</div>
					)}

					<div className='grid grid-cols-4 items-center gap-4'>
						<Label className='text-right text-muted-foreground'>Selected Date</Label>
						<div className='col-span-3 text-muted-foreground'>{format(selectedDate, 'PPP')}</div>
					</div>
				</div>

				<AlertDialogFooter>
					<Button variant='outline' onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleConfirm}>Create Event</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
