import Layout from './Layout';

export default function Profile() {
	const breadcrumbItems = [
		{ title: 'Notifications', href: '/notifications' },
		{ title: 'View all of your notifications' },
	];
	return (
		<Layout breadcrumbItems={breadcrumbItems}>
			<h1> Notifications </h1>
		</Layout>
	);
}
