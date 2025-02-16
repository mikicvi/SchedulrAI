// frontend/src/components/Logout.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-Api';

const Logout = () => {
	const navigate = useNavigate();
	const { apiFetch, isLoading } = useApi();

	useEffect(() => {
		const performLogout = async () => {
			// Wait for CSRF token to be available
			if (isLoading) return;

			try {
				const response = await apiFetch('http://localhost:3000/api/logout', {
					method: 'POST',
				});

				if (!response.ok) {
					throw new Error('Logout failed');
				}

				toast({
					title: 'Success',
					description: 'Logged out successfully',
				});
				navigate('/login');
			} catch (error) {
				console.error('Logout error:', error);
				toast({
					title: 'Error',
					description: 'Failed to logout',
					variant: 'destructive',
				});
				navigate('/');
			}
		};

		performLogout();
	}, [navigate, apiFetch, isLoading]);

	return null;
};

export default Logout;
