import { useEffect, useState } from 'react';
import { useApi } from './use-Api';

function useBackendStatus(pollInterval = 5000) {
	const [status, setStatus] = useState('🟡 Not Ready');
	const { apiFetch } = useApi();

	useEffect(() => {
		let mounted = true;
		let timeoutId: NodeJS.Timeout;

		async function fetchStatus() {
			if (!mounted) return;

			try {
				const response = await apiFetch('http://localhost:3000/api/checkPipelineStatus', {
					credentials: 'include',
				});

				if (!mounted) return;

				if (response.ok) {
					const data = await response.json();
					if (!data.ready) {
						setStatus('🟡 Loading: Backend is still initializing');
						timeoutId = setTimeout(fetchStatus, pollInterval);
						return;
					}
					setStatus('🟢 Ready: All systems reporting healthy');
				} else {
					setStatus('🔴 Error in backend');
					timeoutId = setTimeout(fetchStatus, pollInterval);
				}
			} catch (error) {
				if (!mounted) return;
				setStatus('🔴 Error in backend');
				timeoutId = setTimeout(fetchStatus, pollInterval);
			}
		}

		fetchStatus();

		return () => {
			mounted = false;
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, [apiFetch, pollInterval]);

	return status;
}

export default useBackendStatus;
