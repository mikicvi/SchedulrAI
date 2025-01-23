import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../middlewares/db';
import User from './user.model';
import Event from './event.model';

export interface CalendarAttributes {
	id: number;
	name: string;
	description?: string;
	createdAt?: Date;
	updatedAt?: Date;
	userId?: number; // FK
}

interface CalendarCreationAttributes extends Optional<CalendarAttributes, 'id'> {}

class Calendar extends Model<CalendarAttributes, CalendarCreationAttributes> implements CalendarAttributes {
	public id!: number;
	public name!: string;
	public description?: string;
	public readonly createdAt!: Date;
	public readonly updatedAt!: Date;
	public userId!: number; // Foreign key for User
	public readonly user?: User;
	public readonly events?: Event[];
}

Calendar.init(
	{
		id: {
			type: DataTypes.INTEGER.UNSIGNED,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: new DataTypes.STRING(128),
			allowNull: false,
		},
		description: {
			type: new DataTypes.STRING(256),
			allowNull: true,
		},
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		updatedAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		userId: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id',
			},
		},
	},
	{
		tableName: 'calendars',
		sequelize,
	}
);

export default Calendar;
