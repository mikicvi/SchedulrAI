import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const Logout = () => {
	const navigate = useNavigate();

	useEffect(() => {
		const performLogout = async () => {
			try {
				const response = await fetch('http://localhost:3000/api/logout', {
					method: 'POST',
					credentials: 'include',
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
	}, [navigate]);

	return null;
};

export default Logout;
