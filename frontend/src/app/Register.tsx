import { ThemeProvider } from '@/components/ThemeProvider';
import { PreferencesDropdownMenuMenu } from '@/components/PreferencesDropdownMenu';
import RegisterForm from '@/components/RegisterForm';

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbSeparator,
	BreadcrumbList,
} from '@/components/ui/breadcrumb';

function Register() {
	return (
		<ThemeProvider defaultTheme='system' storageKey='vite-ui-theme'>
			<div className='absolute top-0 right-0 p-4'>
				<PreferencesDropdownMenuMenu />
			</div>
			<div className='flex justify-center p-4 items-center'>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href='/register'>Register</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
					</BreadcrumbList>
				</Breadcrumb>
			</div>

			<div className='flex justify-center items-center h-screen'>
				<RegisterForm />
			</div>
		</ThemeProvider>
	);
}

export default Register;
