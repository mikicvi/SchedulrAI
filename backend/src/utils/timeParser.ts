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

	private toSchedulingDecimal(totalMins: number): number | null {
		if (!this.validateTime(totalMins)) {
			return null;
		}
		const hours = Math.floor(totalMins / 60);
		const leftover = totalMins % 60;
		const leftoverStr = leftover < 10 ? `0${leftover}` : `${leftover}`;
		return parseFloat(`${hours}.${leftoverStr}`);
	}

	private parseDecimalHours(timeString: string): number | null {
		const regex = new RegExp(/^(\d*\.?\d+)\s*(?:hour|hr)?s?$/i);
		const match = regex.exec(timeString);
		if (!match) return null;

		const rawFloat = parseFloat(match[1]);
		const wholeHours = Math.floor(rawFloat);
		const leftoverDec = rawFloat - wholeHours;
		const leftoverMins = Math.round(leftoverDec * 100);

		return this.toSchedulingDecimal(wholeHours * 60 + leftoverMins);
	}

	private parseHoursAndMinutes(timeString: string): number | null {
		const hoursRegex = new RegExp(/(\d+)\s*(?:hour|hr)s?/i);
		const minutesRegex = new RegExp(/(\d+)\s*(?:minute|min)s?/i);

		const hoursMatch = hoursRegex.exec(timeString);
		const minutesMatch = minutesRegex.exec(timeString);

		const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
		const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

		if (!hoursMatch && !minutesMatch) return null;
		return this.toSchedulingDecimal(hours * 60 + minutes);
	}

	public parse(timeString: string): number | null {
		timeString = timeString.trim();
		return this.parseDecimalHours(timeString) ?? this.parseHoursAndMinutes(timeString);
	}
}
