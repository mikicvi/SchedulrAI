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
	dob: z.date({
		required_error: 'A date of birth is required.',
	}),
});

export function DatePickerForm() {
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			dob: new Date(),
		},
	});

	function handleDateChange(date: Date | undefined) {
		if (date) {
			form.setValue('dob', date);
			toast({
				title: 'Date selected:',
				description: (
					<pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
						<code className='text-white'>{format(date, 'PPP')}</code>
					</pre>
				),
			});
		}
	}

	return (
		<Form {...form}>
			<form className='space-y-8'>
				<FormField
					control={form.control}
					name='dob'
					render={({ field }) => (
						<FormItem className='flex flex-col'>
							<FormLabel>Schedule a Working Day</FormLabel>
							<Popover>
								<PopoverTrigger asChild>
									<FormControl>
										<Button
											variant={'outline'}
											className={cn(
												'w-[240px] pl-3 text-left font-normal',
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
										disabled={(date) => date < new Date()}
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
