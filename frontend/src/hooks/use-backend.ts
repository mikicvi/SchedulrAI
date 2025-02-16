import { useEffect, useState } from 'react';
import { useApi } from './use-Api';

// Hook to check the status of the backend, which is exposed via REST API at /api/checkPipelineStatus
function useBackendStatus() {
	const [status, setStatus] = useState('Not Ready');
	const { apiFetch } = useApi();
	useEffect(() => {
		async function fetchStatus() {
			try {
				const response = await apiFetch('http://localhost:3000/api/checkPipelineStatus', {
					credentials: 'include',
				});
				if (response.ok) {
					const data = await response.json();
					// check if data has ready: true
					if (!data.ready) {
						setStatus('🟡 Loading: Backend is still initializing');
						return;
					}
					setStatus('🟢 Ready: All systems reporting healthy');
				} else {
					setStatus('🔴 Error in backend');
					setTimeout(fetchStatus, 5000); // Poll every 5 seconds if error
				}
			} catch (error) {
				setStatus('🔴 Error in backend');
				setTimeout(fetchStatus, 5000); // Poll every 5 seconds if error
			}
		}
		fetchStatus();
	}, []);

	return status;
}

export default useBackendStatus;
