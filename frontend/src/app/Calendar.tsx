import Layout from './Layout';

const Calendar = () => {
	const breadcrumbItems = [{ title: 'Calendar', href: '/calendar' }, { title: 'Task Time Estimation' }];
	return (
		<Layout breadcrumbItems={breadcrumbItems}>
			<h1> Calendar </h1>
		</Layout>
	);
};

export default Calendar;
