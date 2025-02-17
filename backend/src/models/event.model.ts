import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../middlewares/db';
import Calendar from './calendar.model';

export enum Importance {
	UrgentImportant = 'UrgentImportant',
	UrgentNotImportant = 'UrgentNotImportant',
	NotUrgentImportant = 'NotUrgentImportant',
	NotUrgentNotImportant = 'NotUrgentNotImportant',
}

export interface EventAttributes {
	id?: number;
	title: string;
	startTime: Date;
	endTime: Date;
	calendarId: number; // Foreign key for Calendar
	description?: string;
	location?: string;
	resourceId?: string;
	importance?: Importance;
}

interface EventCreationAttributes extends Optional<EventAttributes, 'id'> {}

class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
	public id!: number;
	public title!: string;
	public description?: string;
	public startTime!: Date;
	public endTime!: Date;
	public calendarId!: number; // Foreign key for Calendar
	public location?: string;
	public resourceId?: string;
	public importance?: Importance;
	public readonly calendar?: Calendar;
}

Event.init(
	{
		id: {
			type: DataTypes.INTEGER.UNSIGNED,
			autoIncrement: true,
			primaryKey: true,
		},
		title: {
			type: new DataTypes.STRING(128),
			allowNull: false,
		},
		description: {
			type: new DataTypes.STRING(256),
			allowNull: true,
		},
		startTime: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		endTime: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		calendarId: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false,
			references: {
				model: 'calendars',
				key: 'id',
			},
		},
		location: {
			type: new DataTypes.STRING(256),
			allowNull: true,
		},
		resourceId: {
			type: new DataTypes.STRING(256),
			allowNull: true,
		},
		importance: {
			type: DataTypes.ENUM(
				Importance.UrgentImportant,
				Importance.UrgentNotImportant,
				Importance.NotUrgentImportant,
				Importance.NotUrgentNotImportant
			),
			allowNull: true,
		},
	},
	{
		tableName: 'events',
		sequelize,
	}
);

export default Event;
