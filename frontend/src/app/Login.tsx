import { ThemeProvider } from '@/components/ThemeProvider';
import { AccesibilitySettingsMenu } from '@/components/AccessibilitySettingsMenu';
import LoginForm from '@/components/LoginForm';

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbSeparator,
	BreadcrumbList,
} from '@/components/ui/breadcrumb';

function Login() {
	return (
		<ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
			<div className='absolute top-0 right-0 p-4'>
				<AccesibilitySettingsMenu />
			</div>
			<div className='flex justify-center p-4 items-center'>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href='/login'>Login</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
					</BreadcrumbList>
				</Breadcrumb>
			</div>

			<div className='flex justify-center items-center h-screen'>
				<LoginForm />
			</div>
		</ThemeProvider>
	);
}

export default Login;
