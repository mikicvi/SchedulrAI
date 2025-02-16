import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './index.css';
import { UserProvider } from './contexts/UserContext';
import App from './app/App';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
	<React.StrictMode>
		<Router>
			<UserProvider>
				<App />
			</UserProvider>
		</Router>
	</React.StrictMode>
);
