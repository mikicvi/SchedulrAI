import { useState, useEffect } from 'react';

export const useApi = () => {
	const [csrfToken, setCsrfToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchCsrfToken = async () => {
			try {
				const response = await fetch('http://localhost:3000/api/csrfToken', {
					credentials: 'include',
				});
				const data = await response.json();
				setCsrfToken(data.csrfToken);
			} catch (error) {
				console.error('Failed to fetch CSRF token:', error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchCsrfToken();
	}, []);

	const apiFetch = async (url: string, options: RequestInit = {}) => {
		// Wait for CSRF token to be available
		if (isLoading) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		const headers = {
			'Content-Type': 'application/json',
			_csrf: csrfToken || '',
			...options.headers,
		};

		return fetch(url, {
			...options,
			headers,
			credentials: 'include',
		});
	};

	return { apiFetch, csrfToken, isLoading };
};
