import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const FormSchema = z.object({
	workingDate: z.date({
		required_error: 'A working day is required.',
	}),
});

interface DatePickerFormProps {
	selected?: Date;
	onSelect: (date: Date) => void;
}

export function DatePickerForm({ selected, onSelect }: DatePickerFormProps) {
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			workingDate: selected || new Date(),
		},
	});

	function handleDateChange(date: Date | undefined) {
		if (date) {
			form.setValue('workingDate', date);
			console.log('Date selected:', date);
			toast({
				title: 'Date selected:',
				description: `Date selected: ${format(date, 'PPP')}`,
			});
			onSelect(date);
		}
	}

	return (
		<Form {...form}>
			<form className='space-y-8'>
				<FormField
					control={form.control}
					name='workingDate'
					render={({ field }) => (
						<FormItem className='flex flex-col'>
							<FormLabel>Schedule a Working Day</FormLabel>
							<Popover>
								<PopoverTrigger asChild>
									<FormControl>
										<Button
											variant={'outline'}
											className={cn(
												'w-[248px] pl-3 text-left font-normal',
												!field.value && 'text-muted-foreground'
											)}
										>
											{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
											<CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
										</Button>
									</FormControl>
								</PopoverTrigger>
								<PopoverContent className='w-auto p-0' align='start'>
									<Calendar
										mode='single'
										selected={field.value}
										onSelect={handleDateChange}
										disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
							<FormMessage />
						</FormItem>
					)}
				/>
			</form>
		</Form>
	);
}
