import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import App from "./App";
import ProfileForm from "./components/ProfileForm";
import Settings from "./components/Settings";
import Authentication from "./components/Authentication";

const AppRoutes = () => {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<App />} />
				<Route path="/profile" element={<ProfileForm />} />
				<Route path="/settings" element={<Settings />} />
				<Route path="/auth" element={<Authentication />} />
			</Routes>
		</Router>
	);
};

export default AppRoutes;
