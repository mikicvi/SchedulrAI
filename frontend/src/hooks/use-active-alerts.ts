import { useState, useEffect } from 'react';

const ACTIVE_ALERTS_KEY = 'active_event_alerts';

export interface ActiveAlert {
	id: string;
	eventId: string;
	title: string;
	minutesUntil: number;
	timestamp: number;
}

export const useActiveAlerts = () => {
	const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>(() => {
		const stored = localStorage.getItem(ACTIVE_ALERTS_KEY);
		return stored ? JSON.parse(stored) : [];
	});

	useEffect(() => {
		localStorage.setItem(ACTIVE_ALERTS_KEY, JSON.stringify(activeAlerts));
	}, [activeAlerts]);

	const addAlert = (alert: Omit<ActiveAlert, 'timestamp'>) => {
		setActiveAlerts((prev) => {
			const exists = prev.some((a) => a.eventId === alert.eventId);
			if (exists) return prev;
			return [...prev, { ...alert, timestamp: Date.now() }];
		});
	};

	const removeAlert = (id: string) => {
		setActiveAlerts((prev) => prev.filter((alert) => alert.id !== id));
	};

	return { activeAlerts, addAlert, removeAlert };
};
