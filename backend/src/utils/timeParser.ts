export class TimeParser {
	private readonly maxHours: number;
	private readonly minMinutes: number;

	constructor(maxHours: number, minMinutes: number) {
		this.maxHours = maxHours;
		this.minMinutes = minMinutes;
	}

	private validateTime(minutes: number): boolean {
		return minutes >= this.minMinutes && minutes <= this.maxHours * 60;
	}

	/**
	 * Converts a total number of minutes to scheduling decimal format.
	 * For example, 90 minutes becomes 1.30 (1 hour and 30 minutes).
	 */
	private toSchedulingDecimal(totalMins: number): number | null {
		if (!this.validateTime(totalMins)) {
			return null;
		}
		const hours = Math.floor(totalMins / 60);
		const minutes = totalMins % 60;
		return Number((hours + minutes / 100).toFixed(2));
	}

	/**
	 * Normalises a decimal time value by assuming that the digits after the decimal
	 * point represent minutes (e.g. 1.75 is 1 hour and 75 minutes, which normalises to 2.15).
	 */
	private normaliseDecimalTime(decimalTime: number): number {
		const wholeHours = Math.floor(decimalTime);
		const decimalPart = Number((decimalTime % 1).toFixed(2));
		const minutes = Math.round(decimalPart * 100);

		if (minutes >= 60) {
			const extraHours = Math.floor(minutes / 60);
			const remainingMinutes = minutes % 60;
			return Number((wholeHours + extraHours + remainingMinutes / 100).toFixed(2));
		}

		return Number(decimalTime.toFixed(2));
	}

	/**
	 * Attempts to parse the input as a decimal time.
	 * This handles cases like "1.5", "0.75 hours", ".5", "2.50 hours" etc.
	 */
	private parseDecimalHours(timeString: string): number | null {
		// First, check for an exact decimal with two digits.
		const exactDecimalRegex = /^(\d+\.\d{2})$/;
		const exactMatch = exactDecimalRegex.exec(timeString);
		if (exactMatch) {
			const value = parseFloat(exactMatch[1]);
			const normalised = this.normaliseDecimalTime(value);
			// Convert the scheduling decimal back to minutes correctly.
			const hours = Math.floor(normalised);
			const minutes = Math.round((normalised - hours) * 100);
			const totalMinutes = hours * 60 + minutes;
			return this.validateTime(totalMinutes) ? normalised : null;
		}

		// Then match numbers with optional "hour" or "hr" suffix.
		const regex = /^(\d*\.?\d+)\s*(?:hour|hr)?s?$/i;
		const match = regex.exec(timeString);
		if (!match) return null;

		const rawValue = parseFloat(match[1]);
		const normalised = this.normaliseDecimalTime(rawValue);
		const hours = Math.floor(normalised);
		const minutes = Math.round((normalised - hours) * 100);
		const totalMinutes = hours * 60 + minutes;
		return this.validateTime(totalMinutes) ? normalised : null;
	}

	/**
	 * Parses input strings that explicitly specify hours and minutes.
	 * Examples: "2 hours 50 minutes", "1 hr, 45 min", "2hours30minutes", etc.
	 */
	private parseHoursAndMinutes(timeString: string): number | null {
		const hoursRegex = /(\d+)\s*(?:hour|hr)s?/i;
		const minutesRegex = /(\d+)\s*(?:minute|min)s?/i;

		const hoursMatch = hoursRegex.exec(timeString);
		const minutesMatch = minutesRegex.exec(timeString);

		const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
		const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

		if (!hoursMatch && !minutesMatch) return null;
		return this.toSchedulingDecimal(hours * 60 + minutes);
	}

	/**
	 * Public parse method.
	 * Returns a string in scheduling decimal format (e.g. "1.30") or null if invalid.
	 */
	public parse(timeString: string): number | null {
		timeString = timeString.trim();
		const result = this.parseDecimalHours(timeString) ?? this.parseHoursAndMinutes(timeString);
		return result ?? null;
	}
}
