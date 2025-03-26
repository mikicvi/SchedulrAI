declare global {
	interface Window {
		env: {
			VITE_API_URL: string;
		};
	}
}

export const getEnvConfig = () => {
	return {
		VITE_API_URL: window.env?.VITE_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
	};
};
