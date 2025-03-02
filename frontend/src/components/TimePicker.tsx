import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface TimePickerFormProps {
	selected: string;
	onSelect: (time: string) => void;
	stepping?: number;
	className?: string;
	showLabel?: boolean;
}

export function TimePickerForm({
	selected,
	onSelect,
	className,
	stepping = 30,
	showLabel = true,
}: Readonly<TimePickerFormProps>) {
	// Generate time options based on stepping interval (in minutes)
	const intervals = (24 * 60) / stepping;
	const timeOptions = Array.from({ length: intervals }, (_, i) => {
		const totalMinutes = i * stepping;
		const hour = Math.floor(totalMinutes / 60);
		const minute = totalMinutes % 60;
		// Pad hours and minutes with leading zeros if needed
		const formattedHour = hour.toString().padStart(2, '0');
		const formattedMinute = minute.toString().padStart(2, '0');
		return `${formattedHour}:${formattedMinute}`;
	});

	return (
		<div className='flex flex-col gap-2'>
			{showLabel && <Label>Time</Label>}
			<Select value={selected} onValueChange={onSelect}>
				<SelectTrigger className={cn('w-[342.5px]', className)}>
					<SelectValue placeholder='Select time' />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{timeOptions.map((time) => (
							<SelectItem key={time} value={time}>
								{time}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>
	);
}
