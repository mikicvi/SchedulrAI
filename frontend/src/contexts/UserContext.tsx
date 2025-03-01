import React, { createContext, useContext, useState, useEffect } from 'react';
import { useApi } from '@/hooks/use-Api';

export interface Notification {
	id: string;
	title: string;
	message: string;
	type: 'info' | 'success' | 'warning' | 'error' | 'event';
	timestamp: Date;
	read: boolean;
	eventId?: string;
	importance?: string;
}

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
	notifications: Notification[];
	addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
	markNotificationAsRead: (id: string) => void;
	clearNotifications: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const NOTIFICATIONS_STORAGE_KEY = 'user_notifications';

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
	const [checkingAuth, setCheckingAuth] = useState(true);
	const [notifications, setNotifications] = useState<Notification[]>(() => {
		// Initialize from localStorage, ensuring importance is preserved
		const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			// Ensure existing notifications have their importance carried over from events
			return parsed.map((notification: Notification) => ({
				...notification,
				importance: notification.type === 'event' ? notification.importance : undefined,
			}));
		}
		return [];
	});
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
	}, []); // Don't put apiFetch in the dependencies array - causes issues
	// Save notifications to localStorage whenever they change
	useEffect(() => {
		localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
	}, [notifications]);

	const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
		const newNotification: Notification = {
			...notification,
			id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
			timestamp: new Date(),
			read: false,
		};
		setNotifications((prev) => {
			// Check for duplicates (avoid duplicate event notifications)
			const isDuplicate = prev.some(
				(n) => n.eventId === notification.eventId && n.type === notification.type && !n.read // Only consider unread notifications
			);
			if (isDuplicate) return prev;
			return [newNotification, ...prev].slice(0, 100); // Keep last 100 notifications
		});
	};

	const markNotificationAsRead = (id: string) => {
		setNotifications((prev) =>
			prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification))
		);
	};

	const clearNotifications = () => {
		setNotifications([]);
		localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
	};

	const contextValue = React.useMemo(
		() => ({
			user,
			isAuthenticated,
			checkingAuth,
			notifications,
			addNotification,
			markNotificationAsRead,
			clearNotifications,
		}),
		[user, isAuthenticated, checkingAuth, notifications]
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
