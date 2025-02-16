export enum Importance {
	UrgentImportant = 'UrgentImportant',
	UrgentNotImportant = 'UrgentNotImportant',
	NotUrgentImportant = 'NotUrgentImportant',
	NotUrgentNotImportant = 'NotUrgentNotImportant',
}

export interface Event {
	id: string;
	title: string;
	start: Date;
	end: Date;
	description?: string;
	location?: string;
	resourceId?: string;
	importance?: Importance;
}
