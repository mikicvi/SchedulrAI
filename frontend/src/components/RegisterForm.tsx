import { Label } from './ui/label';
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardDescription, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { GoogleGLogo } from './ui/google-g-logo';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useApi } from '@/hooks/use-Api';

const Register = () => {
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const { toast } = useToast();
	const navigate = useNavigate();
	const { apiFetch } = useApi();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		// Validate passwords match
		if (password !== confirmPassword) {
			toast({
				title: 'Password Error',
				description: 'Passwords do not match',
				variant: 'destructive',
			});
			setIsLoading(false);
			return;
		}

		try {
			const response = await apiFetch('/register', {
				method: 'POST',
				body: JSON.stringify({
					firstName,
					lastName,
					username,
					email,
					password,
				}),
			});

			let data;
			const contentType = response.headers.get('content-type');
			if (contentType && contentType.indexOf('application/json') !== -1) {
				data = await response.json();
			} else {
				// If response is not JSON, get text content
				const textData = await response.text();
				throw new Error(textData || 'Registration failed');
			}

			if (!response.ok) {
				throw new Error(data.message || 'Registration failed');
			}

			toast({
				title: 'Success',
				description: 'Account created successfully!',
			});

			navigate('/login');
		} catch (error) {
			console.error('Registration failed:', error);
			toast({
				title: 'Registration Failed',
				description: error instanceof Error ? error.message : 'Server error. Please try again later.',
				variant: 'destructive',
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleAuth = () => {
		window.location.href = 'http://localhost:3000/api/google'; // Will always prompt for consent
	};

	return (
		<Card className='max-w-lg w-full h-auto mx-auto mt-10 p-6 max-h-[85vh] overflow-y-auto'>
			<CardTitle className='text-2xl font-bold mb-5 justify-center text-center'>
				Create Your SchedulrAI Account
			</CardTitle>
			<CardDescription className='mb-4 flex justify-center text-center'>
				Fill in the form below to create your account and start scheduling today!
			</CardDescription>
			<form onSubmit={handleSubmit}>
				<div className='mb-4 flex gap-4'>
					<div className='flex-1'>
						<Label htmlFor='firstName'>First Name</Label>
						<Input
							type='text'
							id='firstName'
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							required
							disabled={isLoading}
						/>
					</div>
					<div className='flex-1'>
						<Label htmlFor='lastName'>Last Name</Label>
						<Input
							type='text'
							id='lastName'
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							required
							disabled={isLoading}
						/>
					</div>
				</div>
				<div className='mb-4'>
					<Label htmlFor='username'>Username</Label>
					<Input
						type='text'
						id='username'
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						required
						disabled={isLoading}
					/>
				</div>
				<div className='mb-4'>
					<Label htmlFor='email'>Email</Label>
					<Input
						type='email'
						id='email'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
						disabled={isLoading}
					/>
				</div>
				<div className='mb-4'>
					<Label htmlFor='password'>Password</Label>
					<div className='relative'>
						<Input
							type={showPassword ? 'text' : 'password'}
							id='password'
							value={password}
							onChange={(e: any) => setPassword(e.target.value)}
							required
							disabled={isLoading}
						/>
						<button
							type='button'
							onClick={() => setShowPassword(!showPassword)}
							className='absolute right-0 top-1/2 -translate-y-1/2 bg-transparent hover:bg-transparent focus:outline-none'
						>
							{showPassword ? (
								<EyeOff className='h-4 w-4 mr-2 text-gray-500 hover:text-gray-700' />
							) : (
								<Eye className='h-4 w-4 mr-2 text-gray-500 hover:text-gray-700' />
							)}
						</button>
					</div>
				</div>
				<div className='mb-4'>
					<Label htmlFor='confirmPassword'>Confirm Password</Label>
					<Input
						type={showPassword ? 'text' : 'password'}
						id='confirmPassword'
						value={confirmPassword}
						onChange={(e: any) => setConfirmPassword(e.target.value)}
						required
						disabled={isLoading}
					/>
				</div>
				<Button type='submit' className='w-full' disabled={isLoading}>
					{isLoading ? (
						<>
							<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							Registering...
						</>
					) : (
						'Register'
					)}
				</Button>
			</form>
			<p className='flex items-center gap-x-3 text-sm text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border p-10'>
				OR
			</p>
			<Button className='w-full' variant='outline' onClick={handleGoogleAuth}>
				<GoogleGLogo className='mr-2' />
				Create an account with Google
			</Button>
			<div className='mt-4 text-center'>
				<a href='/login' className=' hover:underline'>
					Already have an account? Log in
				</a>
			</div>
		</Card>
	);
};

export default Register;
