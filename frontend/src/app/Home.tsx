import DynamicTextarea from '@/components/ui/textarea-prompt';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import useBackendStatus from '@/hooks/use-backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import usePipeline from '@/hooks/use-pipeline';
import Layout from './Layout';
import { DatePickerForm } from '@/components/date-picker';
import { TimePickerForm } from '@/components/time-picker';
import usePipelineStatus from '@/hooks/use-pipeline-status';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { ConfirmationDialog } from '@/components/TaskCreationDialog';
import { useNavigate } from 'react-router-dom';
import { Event } from '@/types/calendar';
import { EstimationResponse } from '@/types/estimation';
import { toast } from '@/hooks/use-toast';
import { SkeletonCard } from '@/components/ui/card-skeleton';
import { Rocket, ListRestart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const Home = () => {
	const breadcrumbItems = [{ title: 'Task Time Estimation' }];
	const { userInput, loading, response, handleInputChange, handleSubmit, resetPipeline } = usePipeline();
	const backendStatus = useBackendStatus();
	const pipelineStatus = usePipelineStatus();
	const navigate = useNavigate();
	const [showConfirmation, setShowConfirmation] = useState(false);
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [selectedTime, setSelectedTime] = useState<string>('09:00');
	const [estimatedData, setEstimatedData] = useState<EstimationResponse | null>(null);
	const [isSubmitFocused, setIsSubmitFocused] = useState(false);
	const hiddenSubmitRef = useRef<HTMLButtonElement>(null);

	const triggerSubmit = () => {
		hiddenSubmitRef.current?.click();
	};

	const handleDateSelect = (date: Date) => {
		setSelectedDate(date);
	};

	const handleTimeSelect = (time: string) => {
		setSelectedTime(time);
	};

	const cleanupPreviousResponse = () => {
		setEstimatedData(null);
		setShowConfirmation(false);
	};

	const onSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		cleanupPreviousResponse();
		handleSubmit();
	};

	// Update response handling effect
	useEffect(() => {
		// Check backend status first
		if (backendStatus.includes('failed') || backendStatus.includes('error')) {
			toast({
				title: 'AI Processing Error',
				description: 'LLM failed to provide a valid response - please try again.',
				variant: 'destructive',
			});
			cleanupPreviousResponse();
			return;
		}

		if (response) {
			try {
				const parsedResponse = JSON.parse(response);
				const estimationData = {
					...parsedResponse,
					originalPrompt: userInput,
				};

				if (!estimationData.suggestedTime) {
					throw new Error('Missing required field: suggestedTime');
				}

				setEstimatedData(estimationData as EstimationResponse);
				setShowConfirmation(true);
			} catch (error) {
				cleanupPreviousResponse();
				toast({
					title: 'Error',
					description: 'Invalid response format from server',
					variant: 'destructive',
				});
			}
		}
	}, [response, backendStatus]);

	// Handle userInput changes separately if needed - to not trigger Task Creation Dialog on every keystroke
	useEffect(() => {}, [userInput]);

	const handleConfirmScheduling = (eventData: Omit<Event, 'id'>) => {
		navigate('/calendar', {
			state: {
				showEventForm: true,
				eventData: {
					...eventData,
					start: new Date(eventData.start),
					end: new Date(eventData.end),
				},
			},
		});
	};

	const handleScheduleClick = () => {
		if (estimatedData) {
			setShowConfirmation(true);
		}
	};

	// Reset all states and pipeline
	const handleReset = () => {
		resetPipeline();
		setEstimatedData(null);
		setShowConfirmation(false);
	};

	return (
		<Layout breadcrumbItems={breadcrumbItems}>
			<motion.div layout className='flex flex-col'>
				<div className='grid grid-cols-1 gap-6'>
					{/* Date & Time Picker */}
					<div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
						<DatePickerForm onSelect={handleDateSelect} selected={selectedDate} />
						<TimePickerForm onSelect={handleTimeSelect} selected={selectedTime} className='max-w-[248px]' />
					</div>

					{/* Unified Card */}
					<div className='flex justify-center'>
						<Card className='w-full max-w-[1200px]'>
							{/* Input Section */}
							<CardHeader className='flex flex-row justify-between items-start pb-0'>
								<div>
									<CardTitle>Task Description</CardTitle>
									<CardDescription>
										Enter the task details to get an AI-powered time estimation
									</CardDescription>
								</div>
								<div className='flex flex-col items-end gap-2'>
									{loading ? (
										<div className='flex items-center gap-2 p-2 bg-muted rounded-md'>
											<LoadingSpinner />
											<p className='text-xs text-muted-foreground'>Processing...</p>
										</div>
									) : (
										<Button
											variant='default'
											size='lg'
											onClick={triggerSubmit}
											type='button'
											data-focused={isSubmitFocused}
											className='data-[focused=true]:ring-1 data-[focused=true]:ring-ring data-[focused=true]:ring-offset-1'
										>
											<Rocket className='mr-2 h-4 w-4' />
											Submit
										</Button>
									)}
									<p className='text-xs text-muted-foreground'>{pipelineStatus || 'Ready'}</p>
								</div>
							</CardHeader>
							<CardContent className='pt-0 pb-6'>
								<form onSubmit={onSubmit}>
									<DynamicTextarea
										label={backendStatus}
										placeholder='Enter customer message/email here and click submit to begin automated scheduling...'
										id='message'
										value={userInput}
										onChange={handleInputChange}
									/>
									{/* Hidden submit button for tab order */}
									<button
										ref={hiddenSubmitRef}
										type='submit'
										className='sr-only'
										onFocus={() => setIsSubmitFocused(true)}
										onBlur={() => setIsSubmitFocused(false)}
									>
										Submit
									</button>
								</form>
							</CardContent>

							{/* Results Section */}
							<AnimatePresence mode='wait'>
								{(loading || response) && (
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -20 }}
										transition={{ duration: 0.3 }}
									>
										<Separator />
										{loading ? (
											<CardContent>
												<SkeletonCard />
											</CardContent>
										) : (
											<>
												<CardHeader className='pb-2'>
													<div className='flex justify-between items-start'>
														<div>
															<CardTitle>Event Estimation</CardTitle>
															<CardDescription>
																AI time estimation and extracted context
															</CardDescription>
														</div>
														<Button variant='destructive' size='sm' onClick={handleReset}>
															<ListRestart className='mr-2 h-4 w-4' />
															Clear
														</Button>
													</div>
												</CardHeader>
												<CardContent>
													<div className='flex flex-col gap-4'>
														<div className='bg-muted rounded-md p-4 max-h-[40vh] overflow-y-auto'>
															<div className='text-sm whitespace-pre-wrap'>
																{estimatedData &&
																	Object.entries(estimatedData).map(
																		([key, value]) => (
																			<div key={key} className='mb-2'>
																				<span className='font-semibold capitalize'>
																					{key
																						.replace(/([A-Z])/g, ' $1')
																						.trim()}
																					:{' '}
																				</span>
																				<span>{value?.toString()}</span>
																			</div>
																		)
																	)}
															</div>
														</div>
														<Button onClick={handleScheduleClick} className='w-full'>
															Schedule Event
														</Button>
													</div>
												</CardContent>
											</>
										)}
									</motion.div>
								)}
							</AnimatePresence>
						</Card>
					</div>
				</div>
			</motion.div>
			{estimatedData && (
				<ConfirmationDialog
					open={showConfirmation}
					onOpenChange={setShowConfirmation}
					estimatedData={estimatedData}
					selectedDate={selectedDate}
					selectedTime={selectedTime}
					onConfirm={handleConfirmScheduling}
				/>
			)}
		</Layout>
	);
};

export default Home;
