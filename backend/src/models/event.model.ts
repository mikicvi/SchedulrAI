import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../middlewares/db';
import Calendar from './calendar.model';

export interface EventAttributes {
	id: number;
	title: string;
	description?: string;
	startTime: Date;
	endTime: Date;
	calendarId: number; // Foreign key for Calendar
}

interface EventCreationAttributes extends Optional<EventAttributes, 'id'> {}

class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
	public id!: number;
	public title!: string;
	public description?: string;
	public startTime!: Date;
	public endTime!: Date;
	public calendarId!: number; // Foreign key for Calendar
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
	},
	{
		tableName: 'events',
		sequelize,
	}
);

export default Event;
