import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const getCsrfToken = () => {
	const csrfToken = document.cookie.split('; ').find((row) => row.startsWith('csrfToken='));
	return csrfToken ? csrfToken.split('=')[1] : '';
};

export function formatMonthYear(monthStr: string): string {
	try {
		const [year, month] = monthStr.split('-');
		const date = new Date(parseInt(year), parseInt(month) - 1); // Month is 0-indexed in JS Date

		return new Intl.DateTimeFormat('en-US', {
			month: 'long',
			year: 'numeric',
		}).format(date);
	} catch (error) {
		console.error('Error formatting month string:', error);
		return monthStr; // Return the original string if there's an error
	}
}

export function getChartColors() {
	return {
		color1: 'hsl(var(--chart-1))',
		color2: 'hsl(var(--chart-2))',
		color3: 'hsl(var(--chart-3))',
		color4: 'hsl(var(--chart-4))',
		color5: 'hsl(var(--chart-5))',
	};
}
