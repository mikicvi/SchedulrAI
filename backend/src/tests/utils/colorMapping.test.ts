import 'jest';
import { Importance } from '../../models/event.model';
import { importanceToGoogleColor, googleColorToImportance } from '../../utils/colorMapping';

describe('Color Mapping Utils', () => {
	describe('importanceToGoogleColor', () => {
		it.each([
			[Importance.UrgentImportant, '11', 'red'],
			[Importance.UrgentNotImportant, '6', 'orange'],
			[Importance.NotUrgentImportant, '10', 'dark green'],
			[Importance.NotUrgentNotImportant, '7', 'blue'],
			[undefined, '8', 'gray'],
		])('should map %s to %s (%s)', (importance, expectedColor) => {
			expect(importanceToGoogleColor(importance)).toBe(expectedColor);
		});
	});

	describe('googleColorToImportance', () => {
		it.each([
			['11', Importance.UrgentImportant, 'red'],
			['4', Importance.UrgentImportant, 'pink'],
			['6', Importance.UrgentNotImportant, 'orange'],
			['5', Importance.UrgentNotImportant, 'yellow'],
			['10', Importance.NotUrgentImportant, 'green'],
			['3', Importance.NotUrgentImportant, 'purple'],
			['2', Importance.NotUrgentImportant, 'purple'],
			['9', Importance.NotUrgentNotImportant, 'blue'],
			['7', Importance.NotUrgentNotImportant, 'blue'],
			['1', Importance.NotUrgentNotImportant, 'lavender'],
		])('should map %s to %s (%s)', (colorId, expectedImportance) => {
			expect(googleColorToImportance(colorId)).toBe(expectedImportance);
		});

		it.each([['invalid'], ['12'], ['']])('should return null for invalid color ID: %s', (colorId) => {
			expect(googleColorToImportance(colorId)).toBeNull();
		});
	});
});
