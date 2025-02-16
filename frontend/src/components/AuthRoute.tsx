import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LoadingSpinner } from './ui/loading-spinner';
import { useUser } from '@/contexts/UserContext';

const AuthRoute = ({ children }: { children: JSX.Element }) => {
	const userContext = useUser();
	const [localAuth, setLocalAuth] = useState<boolean | null>(null);

	useEffect(() => {
		// Only check local auth if context auth is null
		if (userContext.isAuthenticated === null) {
			const checkAuth = async () => {
				try {
					const response = await fetch('http://localhost:3000/api/checkAuth', {
						credentials: 'include',
					});
					setLocalAuth(response.ok);
				} catch (error) {
					setLocalAuth(false);
				}
			};
			checkAuth();
		}
	}, [userContext.isAuthenticated]);

	const isAuthenticated = userContext.isAuthenticated ?? localAuth;

	if (isAuthenticated === null) {
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
					backgroundColor: 'black',
				}}
			>
				<LoadingSpinner />
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to='/login' />;
	}

	return children;
};

const AuthRouteWrapper = ({ children }: { children: JSX.Element }) => <AuthRoute>{children}</AuthRoute>;

export default AuthRouteWrapper;
