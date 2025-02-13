import Layout from './Layout';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { z } from 'zod';
import { useUser } from '@/contexts/UserContext';
import { toast } from '@/hooks/use-toast';
import { ListRestart, Send } from 'lucide-react';

const emailSchema = z.object({
	to: z.string().email({ message: 'Invalid email address' }),
	subject: z.string().min(1, { message: 'Subject is required' }),
	body: z.string().min(1, { message: 'Body is required' }),
});

export default function SendMail() {
	const { user } = useUser();
	const breadcrumbItems = [
		{ title: 'Send Mail', href: '/sendMail' },
		{ title: 'Send email from your Google Account' },
	];

	const resetFields = () => {
		setTo('');
		setSubject('');
		setBody('');
	};

	const [to, setTo] = useState('');
	const [subject, setSubject] = useState('');
	const [body, setBody] = useState('');

	const handleSendEmail = async () => {
		try {
			emailSchema.parse({ to, subject, body });
			// @todo: consume backend API to send email
			toast({
				title: 'Success',
				description: 'Email to ' + to + ' sent successfully',
			});
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
							value={body}
							onChange={(e) => setBody(e.target.value)}
							required
							placeholder='Email body'
						/>
					</div>
					<div className='flex justify-between'>
						<Button type='submit'>
							Send Email <Send />
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
