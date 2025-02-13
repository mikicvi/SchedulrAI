import { Route, Routes } from 'react-router-dom';
import Login from './app/Login';
import Register from './app/Register';
import Calendar from './app/Calendar';
import Home from './app/Home';
import Profile from './app/Profile';
import Settings from './app/Settings';
import SendMail from './app/SendMail';
import DocChat from './app/DocChat';
import AuthRoute from './components/AuthRoute';
import Logout from './components/Logout';

const AppRoutes = () => {
	return (
		<Routes>
			<Route path='/login' element={<Login />} />
			<Route path='/register' element={<Register />} />
			<Route
				path='/'
				element={
					<AuthRoute>
						<Home />
					</AuthRoute>
				}
			/>
			<Route
				path='/calendar'
				element={
					<AuthRoute>
						<Calendar />
					</AuthRoute>
				}
			/>
			<Route
				path='/sendMail'
				element={
					<AuthRoute>
						<SendMail />
					</AuthRoute>
				}
			/>
			<Route
				path='/documentsChat'
				element={
					<AuthRoute>
						<DocChat />
					</AuthRoute>
				}
			/>
			<Route
				path='/profile'
				element={
					<AuthRoute>
						<Profile />
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
	);
};

export default AppRoutes;
