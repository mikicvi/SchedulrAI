import DynamicTextarea from '@/components/ui/textarea-prompt';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import useBackendStatus from '@/hooks/use-backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import usePipeline from '@/hooks/use-pipeline';
import Layout from './Layout';
import { DatePickerForm } from '@/components/date-picker';
import { Toaster } from '@/components/ui/toaster';

const Home = () => {
	const { userInput, loading, response, handleInputChange, handleSubmit } = usePipeline();

	const breadcrumbItems = [{ title: 'Task Time Estimation' }];

	return (
		<Layout breadcrumbItems={breadcrumbItems}>
			<div className='flex flex-col h-full'>
				<div className='flex justify-center items-center pt-4'>
					<DatePickerForm />
				</div>
				<div className='flex justify-center items-center pt-[27vh]'>
					<DynamicTextarea
						label={useBackendStatus()}
						placeholder='Type/paste customer requirements here'
						id='message'
						value={userInput}
						onChange={handleInputChange}
					/>
					<div className='h-4 px-4'>
						{loading ? (
							<LoadingSpinner className='ml-4' />
						) : (
							<Button variant='outline' onClick={handleSubmit} disabled={loading}>
								Submit
							</Button>
						)}
					</div>
				</div>
				<div className='flex justify-center items-center text-white pt-4'>
					{response && (
						<Card>
							<CardHeader>
								<CardTitle>Time</CardTitle>
								<CardDescription>Estimated time required to complete the task</CardDescription>
							</CardHeader>
							<CardContent>
								<div className='flex justify-center items-center'>
									<Button variant='destructive'>
										<pre>{response}</pre>
									</Button>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
			<Toaster />
		</Layout>
	);
};

export default Home;
