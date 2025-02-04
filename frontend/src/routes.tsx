import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import App from './App';
import Login from './Login';
import Register from './Register';
import ProfileForm from './components/ProfileForm';
import Settings from './components/Settings';
import AuthRoute from './components/AuthRoute';
import Logout from './components/Logout';

const AppRoutes = () => {
	return (
		<Router>
			<Routes>
				<Route path='/login' element={<Login />} />
				<Route path='/register' element={<Register />} />
				<Route
					path='/'
					element={
						<AuthRoute>
							<App />
						</AuthRoute>
					}
				/>
				<Route
					path='/profile'
					element={
						<AuthRoute>
							<ProfileForm />
						</AuthRoute>
					}
				/>
				<Route
					path='/settings'
					element={
						<AuthRoute>
							<Settings />
						</AuthRoute>
					}
				/>
				<Route
					path='/logout'
					element={
						<AuthRoute>
							<Logout />
						</AuthRoute>
					}
				/>
			</Routes>
		</Router>
	);
};

export default AppRoutes;
