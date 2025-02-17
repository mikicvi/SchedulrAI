import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const getCsrfToken = () => {
	const csrfToken = document.cookie.split('; ').find((row) => row.startsWith('csrfToken='));
	return csrfToken ? csrfToken.split('=')[1] : '';
};
