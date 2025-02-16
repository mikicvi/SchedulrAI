import Layout from './Layout';

export default function Profile() {
	const breadcrumbItems = [{ title: 'Profile', href: '/profile' }, { title: 'Customise your user profile' }];
	return (
		<Layout breadcrumbItems={breadcrumbItems}>
			<h1> Profile </h1>
		</Layout>
	);
}
