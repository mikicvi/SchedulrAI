import Layout from './Layout';

export default function Settings() {
	const breadcrumbItems = [{ title: 'Settings', href: '/settings' }, { title: 'Customise Application Settings' }];
	return (
		<Layout breadcrumbItems={breadcrumbItems}>
			<h1> Settings </h1>
		</Layout>
	);
}
