import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApi } from '@/hooks/use-Api';

interface User {
	id: number;
	username: string;
	email: string;
	firstName: string;
	lastName: string;
	createdAt: string;
	updatedAt: string;
	userSettings: any;
	googleUser: boolean;
	calendarId: any;
	initials: string;
}
interface UserContextType {
	user: User | null;
	isAuthenticated: boolean | null;
	checkingAuth: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
	const [checkingAuth, setCheckingAuth] = useState(true);
	const { apiFetch } = useApi();

	useEffect(() => {
		let mounted = true;

		const checkAuth = async () => {
			if (!mounted) return;

			try {
				const response = await apiFetch('/checkAuth', {
					credentials: 'include',
				});

				if (!mounted) return;

				if (response.ok) {
					const data = await response.json();
					const isGoogleUser = !!data.user.googleId;

					setIsAuthenticated(true);
					if (data.user) {
						setUser({
							id: data.user.id,
							username: data.user.username,
							email: data.user.email,
							firstName: data.user.firstName,
							lastName: data.user.lastName,
							createdAt: data.user.createdAt,
							updatedAt: data.user.updatedAt,
							userSettings: data.user.userSettings,
							googleUser: isGoogleUser,
							calendarId: data.user.calendarId,
							initials: data.user.firstName[0] + data.user.lastName[0],
						});
					}
				} else {
					setIsAuthenticated(false);
					setUser(null);
				}
			} catch (error) {
				if (!mounted) return;
				console.error('Auth check error:', error);
				setIsAuthenticated(false);
				setUser(null);
			} finally {
				if (mounted) {
					setCheckingAuth(false);
				}
			}
		};

		checkAuth();

		return () => {
			mounted = false;
		};
	}, []); // Remove apiFetch from dependencies

	const contextValue = React.useMemo(
		() => ({
			user,
			isAuthenticated,
			checkingAuth,
		}),
		[user, isAuthenticated, checkingAuth]
	);

	return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export const useUser = () => {
	const context = useContext(UserContext);
	if (context === undefined) {
		throw new Error('useUser must be used within a UserProvider');
	}
	return context;
};
