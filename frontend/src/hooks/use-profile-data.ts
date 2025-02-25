import { useState } from 'react';
import { useApi } from './use-Api';

export function useProfileData() {
	const { apiFetch } = useApi();
	const [profileData, setProfileData] = useState(null);

	const fetchProfileData = async () => {
		try {
			const response = await apiFetch('/profile');
			if (!response.ok) throw new Error('Failed to fetch profile data');

			const data = await response.json();
			if (data.success) {
				setProfileData(data.user);
			} else {
				throw new Error(data.message);
			}
		} catch (error) {
			console.error('Failed to fetch profile data:', error);
			throw error;
		}
	};

	return {
		profileData,
		fetchProfileData,
	};
}
