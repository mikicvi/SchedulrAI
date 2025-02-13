import { Navigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';

const AuthRoute = ({ children }: { children: JSX.Element }) => {
	const { isAuthenticated } = useUser();

	if (isAuthenticated === null) {
		return <div>Loading...</div>; // Or a loading spinner
	}

	if (!isAuthenticated) {
		return <Navigate to='/login' />;
	}

	return children;
};

const AuthRouteWrapper = ({ children }: { children: JSX.Element }) => <AuthRoute>{children}</AuthRoute>;

export default AuthRouteWrapper;
