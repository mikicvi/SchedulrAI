// import axios from 'axios';

// const API_URL = 'http://localhost:3000/api/auth';

// export interface LoginCredentials {
// 	username: string;
// 	password: string;
// }

// export interface RegisterCredentials extends LoginCredentials {
// 	email: string;
// 	firstName?: string;
// 	lastName?: string;
// }

// class AuthService {
// 	async login(credentials: LoginCredentials) {
// 		const response = await axios.post(`${API_URL}/login`, credentials, { withCredentials: true });
// 		return response.data;
// 	}

// 	async register(credentials: RegisterCredentials) {
// 		const response = await axios.post(`${API_URL}/register`, credentials, { withCredentials: true });
// 		return response.data;
// 	}

// 	async logout() {
// 		const response = await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
// 		return response.data;
// 	}

// 	async checkAuth() {
// 		const response = await axios.get(`${API_URL}/checkAuth`, { withCredentials: true });
// 		return response.data;
// 	}

// 	initiateGoogleLogin() {
// 		window.location.href = `${API_URL}/google`;
// 	}
// }

// export default new AuthService();
