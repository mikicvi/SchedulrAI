import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useApi } from '@/hooks/use-Api';

const profileFormSchema = z.object({
	username: z
		.string()
		.min(2, { message: 'Username must be at least 2 characters.' })
		.max(30, { message: 'Username must not be longer than 30 characters.' }),
	email: z.string().email({ message: 'Please enter a valid email address' }),
	firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
	lastName: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
	userSettings: z
		.object({
			theme: z.enum(['light', 'dark', 'system']).default('system'),
			notifications: z.boolean().default(true),
			timezone: z.string().default('UTC'),
		})
		.optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfileForm = ({ defaultValues, onSuccess }: { defaultValues: ProfileFormValues; onSuccess: () => void }) => {
	const { apiFetch } = useApi();
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<ProfileFormValues>({
		resolver: zodResolver(profileFormSchema),
		defaultValues,
		mode: 'onChange',
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		console.log('Form submitted with values:', form.getValues());

		try {
			const response = await apiFetch('/profile', {
				method: 'PUT',
				body: JSON.stringify(form.getValues()),
			});

			const data = await response.json();

			if (response.ok && data.success) {
				toast({
					title: 'Success',
					description: 'Profile updated successfully',
				});
				onSuccess();
			} else {
				throw new Error(data.message || 'Failed to update profile');
			}
		} catch (error) {
			console.error('Submission error:', error);
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Failed to update profile',
				variant: 'destructive',
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={handleSubmit} className='space-y-8'>
				<FormField
					control={form.control}
					name='username'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Username</FormLabel>
							<FormControl>
								<Input placeholder='username' {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='email'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input placeholder='email' {...field} />
							</FormControl>
							<FormDescription>You can manage verified email addresses in your settings.</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='firstName'
					render={({ field }) => (
						<FormItem>
							<FormLabel>First Name</FormLabel>
							<FormControl>
								<Input placeholder='First Name' {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name='lastName'
					render={({ field }) => (
						<FormItem>
							<FormLabel>Last Name</FormLabel>
							<FormControl>
								<Input placeholder='Last Name' {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type='submit' disabled={isSubmitting}>
					{isSubmitting ? 'Updating...' : 'Update profile'}
				</Button>
			</form>
		</Form>
	);
};

export default ProfileForm;
