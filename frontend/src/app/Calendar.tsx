import Layout from './Layout';
import CalendarComponent from '@/components/calendar/CalendarComponent';
import { Card } from '@/components/ui/card';

const Calendar = () => {
	const breadcrumbItems = [{ title: 'Calendar', href: '/calendar' }, { title: 'Manage Your Events' }];
	return (
		<Layout breadcrumbItems={breadcrumbItems}>
			<Card className='pb-4'>
				<CalendarComponent />
			</Card>
		</Layout>
	);
};

export default Calendar;
