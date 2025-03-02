import { Importance } from '../models/event.model';

// Google Calendar color IDs:
// 1: Lavender (Light Purple)
// 2: Sage (Light Green)
// 3: Grape (Purple)
// 4: Flamingo (Light Red/Pink)
// 5: Banana (Yellow)
// 6: Tangerine (Orange)
// 7: Peacock (Blue-Green) - Default
// 8: Graphite (Gray)
// 9: Blueberry (Blue)
// 10: Basil (Dark Green)
// 11: Tomato (Red)

/**
 * Maps task importance levels to Google Calendar color IDs.
 * @param importance - The importance level of the task
 * @returns A string representing the Google Calendar color ID
 * - '11' (Tomato/Red) for Urgent & Important
 * - '6' (Tangerine/Orange) for Urgent & Not Important
 * - '10' (Basil/Dark Green) for Not Urgent & Important
 * - '7' (Peacock/Blue) for Not Urgent & Not Important
 * - '8' (Graphite/Gray) as default
 */
export const importanceToGoogleColor = (importance: Importance): string => {
	switch (importance) {
		case Importance.UrgentImportant:
			return '11'; // Tomato (Red)
		case Importance.UrgentNotImportant:
			return '6'; // Tangerine (Orange)
		case Importance.NotUrgentImportant:
			return '10'; // Basil (Dark Green)
		case Importance.NotUrgentNotImportant:
			return '7'; // Peacock (Blue)
		default:
			return '8'; // Graphite (Gray)
	}
};

/**
 * Maps Google Calendar color IDs to event importance levels.
 * @param colorId - The Google Calendar color ID string
 * @returns The corresponding Importance enum value or null if no match is found
 *
 * Color ID mappings:
 * - 11, 6: Urgent & Important
 * - 5, 4: Urgent but Not Important
 * - 10, 3, 2: Important but Not Urgent
 * - 9, 7, 1: Neither Urgent nor Important
 * - Default: null
 */
export const googleColorToImportance = (colorId: string): Importance => {
	switch (colorId) {
		case '11':
		case '4':
			return Importance.UrgentImportant;
		case '6':
		case '5':
			return Importance.UrgentNotImportant;
		case '10':
		case '3':
		case '2':
			return Importance.NotUrgentImportant;
		case '9':
		case '7':
		case '1':
			return Importance.NotUrgentNotImportant;
		default:
			return null; // Default to Graphite (Gray)
	}
};
