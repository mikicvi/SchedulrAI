import { Navigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';

const AuthRoute = ({ children }: { children: JSX.Element }) => {
	const { isAuthenticated } = useUser();

	if (isAuthenticated === null) {
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
					backgroundColor: 'var(--background)',
				}}
			>
				{/* <LoadingSpinner /> */}
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
