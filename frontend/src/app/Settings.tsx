import Layout from './Layout';
import { SettingsForm } from '@/components/SettingsForm';

export default function Settings() {
	const breadcrumbItems = [{ title: 'Settings', href: '/settings' }, { title: 'Customise Application Settings' }];
	return (
		<Layout breadcrumbItems={breadcrumbItems}>
			<SettingsForm />
		</Layout>
	);
}
