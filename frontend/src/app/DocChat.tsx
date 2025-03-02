import Layout from './Layout';
import DocumentsChat from '@/components/DocumentsChat';

export default function DocumentsChatPage() {
	const breadcrumbItems = [
		{ title: 'Documents Chat', href: '/documentsChat' },
		{ title: 'Chat with your documents' },
	];

	return (
		<Layout breadcrumbItems={breadcrumbItems}>
			<DocumentsChat />
		</Layout>
	);
}
