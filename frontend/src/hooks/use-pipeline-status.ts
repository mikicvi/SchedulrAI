import { useState, useEffect } from 'react';

const usePipelineStatus = () => {
	const [status, setStatus] = useState<string>('');

	useEffect(() => {
		let eventSource: EventSource | null = null;
		let retryCount = 0;
		const maxRetries = 3;

		const connectSSE = () => {
			eventSource = new EventSource('http://localhost:3000/api/status', { withCredentials: true });

			eventSource.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					setStatus(data.status);
				} catch (error) {
					console.error('Failed to parse SSE data:', error);
				}
			};

			eventSource.onerror = (error) => {
				console.error('SSE error:', error);
				if (eventSource) {
					eventSource.close();
					if (retryCount < maxRetries) {
						retryCount++;
						setTimeout(connectSSE, 1000 * retryCount);
					}
				}
			};

			eventSource.onopen = () => {
				console.log('SSE connection opened');
				retryCount = 0;
			};
		};

		connectSSE();

		return () => {
			if (eventSource) {
				eventSource.close();
			}
		};
	}, []);

	return status;
};

export default usePipelineStatus;
