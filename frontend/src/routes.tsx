import { Route, Routes, useLocation } from 'react-router-dom';
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
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import Notifications from './app/Notifications';

const AppRoutes = () => {
	const location = useLocation();

	return (
		<AnimatePresence mode='wait'>
			<Routes location={location} key={location.pathname}>
				<Route
					path='/login'
					element={
						<PageTransition>
							<Login />
						</PageTransition>
					}
				/>
				<Route
					path='/register'
					element={
						<PageTransition>
							<Register />
						</PageTransition>
					}
				/>
				<Route
					path='/'
					element={
						<AuthRoute>
							<PageTransition>
								<Home />
							</PageTransition>
						</AuthRoute>
					}
				/>
				<Route
					path='/calendar'
					element={
						<AuthRoute>
							<PageTransition>
								<Calendar />
							</PageTransition>
						</AuthRoute>
					}
				/>
				<Route
					path='/sendMail'
					element={
						<AuthRoute>
							<PageTransition>
								<SendMail />
							</PageTransition>
						</AuthRoute>
					}
				/>
				<Route
					path='/documentsChat'
					element={
						<AuthRoute>
							<PageTransition>
								<DocChat />
							</PageTransition>
						</AuthRoute>
					}
				/>
				<Route
					path='/profile'
					element={
						<AuthRoute>
							<PageTransition>
								<Profile />
							</PageTransition>
						</AuthRoute>
					}
				/>
				<Route
					path='/settings'
					element={
						<AuthRoute>
							<PageTransition>
								<Settings />
							</PageTransition>
						</AuthRoute>
					}
				/>
				<Route
					path='/logout'
					element={
						<AuthRoute>
							<PageTransition>
								<Logout />
							</PageTransition>
						</AuthRoute>
					}
				/>
				<Route
					path='/notifications'
					element={
						<AuthRoute>
							<PageTransition>
								<Notifications />
							</PageTransition>
						</AuthRoute>
					}
				/>
			</Routes>
		</AnimatePresence>
	);
};

export default AppRoutes;
