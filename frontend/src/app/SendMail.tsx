import Layout from './Layout';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { z } from 'zod';
import { useUser } from '@/contexts/UserContext';
import { toast } from '@/hooks/use-toast';
import { ListRestart, Send, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '@/hooks/use-Api';

const emailSchema = z.object({
	to: z.string().email({ message: 'Invalid email address' }),
	subject: z.string().min(1, { message: 'Subject is required' }),
	body: z.string().min(1, { message: 'Body is required' }),
});

export default function SendMail() {
	const { apiFetch } = useApi();
	const { user } = useUser();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const breadcrumbItems = [
		{ title: 'Send Mail', href: '/sendMail' },
		{ title: 'Send email from your Google Account' },
	];
	const [isSending, setIsSending] = useState(false);

	const [to, setTo] = useState(searchParams.get('to') || '');
	const [subject, setSubject] = useState(searchParams.get('subject') || '');
	const [body, setBody] = useState(searchParams.get('body') || '');

	useEffect(() => {
		setTo(searchParams.get('to') || '');
		setSubject(searchParams.get('subject') || '');
		setBody(searchParams.get('body') || '');
	}, [searchParams]);

	// Redirect if not Google authenticated
	if (!user?.googleUser) {
		return (
			<Layout breadcrumbItems={breadcrumbItems}>
				<Card className='p-6'>
					<div className='text-center'>
						<h2 className='text-lg font-semibold mb-4'>Google Authentication Required</h2>
						<p className='mb-4'>You need to authenticate with Google to use the email feature.</p>
						<Button onClick={() => navigate('/')} variant='secondary'>
							Return to Home
						</Button>
					</div>
				</Card>
			</Layout>
		);
	}

	const resetFields = () => {
		setTo('');
		setSubject('');
		setBody('');
	};

	const handleSendEmail = async () => {
		setIsSending(true);
		try {
			emailSchema.parse({ to, subject, body });

			const response = await apiFetch('http://localhost:3000/api/email/send', {
				method: 'POST',
				body: JSON.stringify({ to, subject, body }),
			});

			if (response.ok) {
				toast({
					title: 'Success',
					description: 'Email to ' + to + ' sent successfully',
				});
			} else {
				const error = await response.json();
				toast({
					title: 'Error',
					description: error.message,
					variant: 'destructive',
				});
			}
		} catch (error) {
			if (error instanceof z.ZodError) {
				toast({
					title: 'Error',
					description: `${error.errors.map((e) => e.message).join('\n')}`,
					variant: 'destructive',
				});
			} else {
				toast({
					title: 'Error',
					description: 'Failed to send email',
					variant: 'destructive',
				});
			}
		} finally {
			setIsSending(false);
		}
	};

	return (
		<Layout breadcrumbItems={breadcrumbItems}>
			<Card>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						handleSendEmail();
					}}
					className='p-4'
				>
					<div className='mb-4'>
						<Label>From</Label>
						<Input value={user?.email || ''} readOnly placeholder='Your email address' />
					</div>
					<div className='mb-4'>
						<Label>To</Label>
						<Input
							value={to}
							onChange={(e) => setTo(e.target.value)}
							required
							placeholder='Recipient email address'
						/>
					</div>
					<div className='mb-4'>
						<Label>Subject</Label>
						<Input
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							required
							placeholder='Email subject'
						/>
					</div>
					<div className='mb-4'>
						<Label>Body</Label>
						<Textarea
							className='min-h-[250px]'
							value={body}
							onChange={(e) => setBody(e.target.value)}
							required
							placeholder='Email body'
						/>
					</div>
					<div className='flex justify-between'>
						<Button type='submit' disabled={isSending} className='flex items-center space-x-2'>
							{isSending ? <RefreshCw className='w-4 h-4 animate-spin' /> : <Send className='w-4 h-4' />}
							<span>{isSending ? 'Sending...' : 'Send Email'}</span>
						</Button>
						<Button type='reset' variant='secondary' className='ml-4' onClick={resetFields}>
							Reset Fields <ListRestart />
						</Button>
					</div>
				</form>
			</Card>
		</Layout>
	);
}
