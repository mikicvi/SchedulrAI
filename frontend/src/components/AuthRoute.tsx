import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const AuthRoute = ({ children }: { children: JSX.Element }) => {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const response = await fetch('http://localhost:3000/api/checkAuth', {
					credentials: 'include',
				});
				if (response.ok) {
					setIsAuthenticated(true);
				} else {
					setIsAuthenticated(false);
				}
			} catch (error) {
				setIsAuthenticated(false);
			}
		};

		checkAuth();
	}, []);

	if (isAuthenticated === null) {
		return <div>Loading...</div>; // Or a loading spinner
	}

	if (!isAuthenticated) {
		return <Navigate to='/login' />;
	}

	return children;
};

export default AuthRoute;
