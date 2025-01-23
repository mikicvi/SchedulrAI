import Calendar from './calendar.model';
import User from './user.model';
import Event from './event.model';

User.hasOne(Calendar, {
	sourceKey: 'id',
	foreignKey: 'userId',
	as: 'calendar',
});
Calendar.belongsTo(User, {
	foreignKey: 'userId',
	as: 'user',
});
Calendar.hasMany(Event, {
	sourceKey: 'id',
	foreignKey: 'calendarId',
	as: 'events',
});
Event.belongsTo(Calendar, {
	foreignKey: 'calendarId',
	as: 'calendar',
});
