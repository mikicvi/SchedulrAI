import { Label } from '@radix-ui/react-dropdown-menu';
import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardDescription, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { GoogleGLogo } from './ui/google-g-logo';
// import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Toaster } from './ui/toaster';
import { useApi } from '@/hooks/use-Api';

const LoginForm = () => {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	// const navigate = useNavigate();
	const { apiFetch } = useApi();

	const handleSubmit = async (e: any) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			const response = await apiFetch('http://localhost:3000/api/login', {
				method: 'POST',
				body: JSON.stringify({ username, password }),
			});

			let data;
			const contentType = response.headers.get('content-type');
			if (contentType && contentType.indexOf('application/json') !== -1) {
				data = await response.json();
			} else {
				const textData = await response.text();
				throw new Error(textData || 'Login failed');
			}

			if (!response.ok) {
				throw new Error(data.message || 'Login failed');
			}

			toast({
				title: 'Success',
				description: 'Logged in successfully!',
			});

			window.location.href = '/';
		} catch (error) {
			console.error('Error:', error);
			toast({
				title: 'Login Failed',
				description: error instanceof Error ? error.message : 'Invalid username or password. Please try again.',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleAuth = () => {
		window.location.href = 'http://localhost:3000/api/google/callback';
	};

	return (
		<Card className='max-w-lg w-full h-auto mx-auto mt-10 p-6'>
			<CardTitle className='text-2xl font-bold mb-5 flex justify-center'>Sign in to SchedulrAI</CardTitle>
			<CardDescription className='mb-4 flex justify-center'>
				Welcome back! Please, sign in to continue
			</CardDescription>
			<form onSubmit={handleSubmit}>
				<div className='mb-4'>
					<Label className='username'>Username</Label>
					<Input
						type='text'
						id='username'
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
					/>
				</div>
				<div className='mb-4'>
					<Label className='password'>Password</Label>
					<div className='relative'>
						<Input
							type={showPassword ? 'text' : 'password'}
							id='password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
						<button
							type='button'
							onClick={() => setShowPassword(!showPassword)}
							className='absolute right-0 top-1/2 -translate-y-1/2 bg-transparent hover:bg-transparent focus:outline-none outline-none'
						>
							{showPassword ? (
								<EyeOff className='h-4 w-4 mr-2 text-gray-500 hover:text-gray-700' />
							) : (
								<Eye className='h-4 w-4 mr-2 text-gray-500 hover:text-gray-700' />
							)}
						</button>
					</div>
				</div>
				<Button disabled={isLoading} type='submit' className='w-full'>
					{isLoading ? (
						<>
							<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							Please wait
						</>
					) : (
						'Login'
					)}
				</Button>
			</form>
			<p className='flex items-center gap-x-3 text-sm text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border p-10'>
				OR CONTINUE WITH
			</p>
			<Button className='w-full' variant='outline' onClick={handleGoogleAuth}>
				<GoogleGLogo className='mr-2' />
				Google
			</Button>

			<div className='mt-4 text-center'>
				<a href='/register' className=' hover:underline'>
					Don't have an account? Sign up
				</a>
			</div>
			<Toaster />
		</Card>
	);
};

export default LoginForm;
