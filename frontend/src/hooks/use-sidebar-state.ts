import { useState, useEffect } from 'react';

const SIDEBAR_STORAGE_KEY = 'sidebar_expanded';

export function useSidebarState(defaultValue: boolean = true) {
	const [isExpanded, setIsExpanded] = useState(() => {
		const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
		return stored ? JSON.parse(stored) : defaultValue;
	});

	useEffect(() => {
		localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(isExpanded));
	}, [isExpanded]);

	return [isExpanded, setIsExpanded] as const;
}
