import { useState, useCallback, useRef } from 'react';

export const useApi = () => {
	const [isLoading, setIsLoading] = useState(false);
	const csrfTokenRef = useRef<string | null>(null);
	const csrfPromiseRef = useRef<Promise<string> | null>(null);

	const getCsrfToken = useCallback(async () => {
		// Return cached token if available
		if (csrfTokenRef.current) {
			return csrfTokenRef.current;
		}

		// If there's already a request in progress, return its promise
		if (csrfPromiseRef.current) {
			return csrfPromiseRef.current;
		}

		// Create new request
		csrfPromiseRef.current = fetch('http://localhost:3000/api/csrfToken', {
			credentials: 'include',
		})
			.then((response) => response.json())
			.then((data) => {
				csrfTokenRef.current = data.csrfToken;
				csrfPromiseRef.current = null;
				return data.csrfToken;
			})
			.catch((error) => {
				csrfPromiseRef.current = null;
				console.error('Failed to fetch CSRF token:', error);
				throw error;
			});

		return csrfPromiseRef.current;
	}, []);

	const apiFetch = useCallback(
		async (url: string, options: RequestInit = {}) => {
			setIsLoading(true);
			const defaultUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
			// Support both absolute URLs and relative paths
			const apiUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `${defaultUrl}/${url}`;
			try {
				const csrfToken = await getCsrfToken();

				// Create headers with CSRF token
				const headers = new Headers(options.headers || {});
				headers.set('X-CSRF-TOKEN', csrfToken);

				// Only set Content-Type if body is present
				if (options.body) {
					headers.set('Content-Type', 'application/json');
				}
				const response = await fetch(apiUrl, {
					...options,
					headers,
					credentials: 'include',
				});

				if (response.status === 403) {
					// Clear cached token
					csrfTokenRef.current = null;

					// Get new token and retry
					const newToken = await getCsrfToken();
					headers.set('X-CSRF-TOKEN', newToken);

					return fetch(apiUrl, {
						...options,
						headers,
						credentials: 'include',
					});
				}

				return response;
			} catch (error) {
				console.error('API fetch error:', error);
				throw error;
			} finally {
				setIsLoading(false);
			}
		},
		[getCsrfToken]
	);

	return { apiFetch, isLoading };
};
