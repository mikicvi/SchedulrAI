import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcrypt';
import { sequelize } from '../middlewares/db';
import Calendar from './calendar.model';

// Define User attributes
export interface UserAttributes {
	id: number;
	username: string;
	password: string;
	email?: string;
	googleId?: string;
	googleAccessToken?: string;
	googleRefreshToken?: string;
	firstName?: string;
	lastName?: string;
	createdAt: Date;
	userSettings?: any;
	calendarId?: number; //FK
}

// Define creation attributes
interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

// Define User class,
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
	public id!: number;
	public username!: string;
	public password!: string;
	public email?: string;
	public googleId?: string;
	public googleAccessToken?: string;
	public googleRefreshToken?: string;
	public firstName?: string;
	public lastName?: string;
	public createdAt!: Date;
	public userSettings?: any;
	public calendarId?: number;
	public readonly calendar?: Calendar;

	public async validPassword(password: string): Promise<boolean> {
		return await bcrypt.compare(password, this.password);
	}
}

User.init(
	{
		id: {
			type: DataTypes.INTEGER.UNSIGNED,
			autoIncrement: true,
			primaryKey: true,
		},
		username: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		password: {
			type: DataTypes.STRING,
			allowNull: true, // Changed from false to true
			validate: {
				// Only require password if no googleId
				customValidator(value: string) {
					if (!this.googleId && !value) {
						throw new Error('Password is required for non-Google users');
					}
				},
			},
		},
		email: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		googleId: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		googleAccessToken: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		googleRefreshToken: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		firstName: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		lastName: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: new Date(),
		},
		userSettings: {
			type: DataTypes.JSON,
			allowNull: true,
		},
		calendarId: {
			type: DataTypes.INTEGER.UNSIGNED,
			allowNull: true,
			references: {
				model: 'calendars',
				key: 'id',
			},
		},
	},
	{
		sequelize,
		tableName: 'users',
		hooks: {
			beforeCreate: async (user: User) => {
				// Only hash password if it exists (for non-Google users)
				if (user.password) {
					const salt = await bcrypt.genSalt(10);
					user.password = await bcrypt.hash(user.password, salt);
				}
			},
			beforeUpdate: async (user: User) => {
				// Only hash password if it's being updated
				if (user.changed('password') && user.password) {
					const salt = await bcrypt.genSalt(10);
					user.password = await bcrypt.hash(user.password, salt);
				}
			},
		},
	}
);

export default User;
