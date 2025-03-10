import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApi } from '@/hooks/use-Api';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { RefreshCw, Save, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SampleFormat } from './SampleFormat';

const knowledgeItemSchema = z.object({
	title: z.string().nonempty('Title is required'),
	content: z.string().nonempty('Content is required'),
});

const settingsFromSchema = z.object({
	userSettings: z.object({
		knowledgeBase: z.array(knowledgeItemSchema).default([]),
	}),
});

type SettingsFormValues = z.infer<typeof settingsFromSchema>;

type Document = {
	title: string;
	content: string;
	type: 'default' | 'user';
};

const groupDocumentsByType = (documents: Document[]) => {
	const groups = {
		default: documents.filter((doc) => doc.type === 'default'),
		user: documents.filter((doc) => doc.type === 'user'),
	};
	return groups;
};

export function SettingsForm() {
	const { user } = useUser();
	const { apiFetch } = useApi();
	const [isProcessing, setIsProcessing] = useState(false);
	const [hasDocuments, setHasDocuments] = useState(false);
	const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
	const [showResetAlert, setShowResetAlert] = useState(false);
	const [showIndexAlert, setShowIndexAlert] = useState(false);
	const [openSections, setOpenSections] = useState<string[]>(['user-category']);
	const form = useForm<SettingsFormValues>({
		resolver: zodResolver(settingsFromSchema),
		defaultValues: {
			userSettings: {
				knowledgeBase: [], // Always start with empty array
			},
		},
	});

	const fetchDocuments = async () => {
		try {
			const response = await apiFetch('/kb/listDocuments');
			if (response.ok) {
				const data = await response.json();
				setAvailableDocuments(data.documents);
			}
		} catch (error) {
			console.error('Failed to fetch documents:', error);
		}
	};

	const deleteDocument = async (filename: string) => {
		try {
			setIsProcessing(true);
			const response = await apiFetch(`/kb/document/${filename}`, {
				method: 'DELETE',
			});

			if (!response.ok) {
				throw new Error('Failed to delete document');
			}

			// Only fetch updated documents, don't reset the form
			await fetchDocuments();

			toast({
				title: 'Success',
				description: 'Document deleted successfully',
			});
		} catch (error) {
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Failed to delete document',
				variant: 'destructive',
			});
		} finally {
			setIsProcessing(false);
		}
	};

	const onSubmit = async (data: SettingsFormValues) => {
		try {
			setIsProcessing(true);

			// Ensure we have a valid array of documents
			const knowledgeBase = data.userSettings?.knowledgeBase || [];

			const response = await apiFetch('/kb/knowledge/update', {
				method: 'POST',
				body: JSON.stringify(knowledgeBase),
			});

			if (!response.ok) {
				throw new Error('Failed to save knowledge base');
			}

			await fetchDocuments();

			// Reset the form after successful save, ensuring the user doesn't accidentally overwrite the data
			form.reset({
				userSettings: {
					knowledgeBase: [],
				},
			});

			toast({
				title: 'Success',
				description: 'Knowledge base updated successfully',
			});
		} catch (error) {
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : `Failed to save knowledge base`,
				variant: 'destructive',
			});
		} finally {
			setIsProcessing(false);
		}
	};

	const handleRestKnowledgeBase = async () => {
		try {
			setIsProcessing(true);
			const response = await apiFetch('/kb/knowledge/reset', {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error('Failed to reset the knowledge base');
			}

			//Reset the form
			form.reset({
				userSettings: {
					knowledgeBase: [],
				},
			});

			toast({
				title: 'Success',
				description: 'Knowledge base reset successfully',
			});
		} catch (error) {
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : `Failed to reset knowledge base`,
				variant: 'destructive',
			});
		} finally {
			setIsProcessing(false);
		}
	};

	const indexKnowledgeBase = async () => {
		try {
			setIsProcessing(true);
			const response = await apiFetch('/kb/indexDocuments', {
				method: 'POST',
			});

			if (!response.ok) {
				throw new Error('Failed to index the knowledge base');
			}

			toast({
				title: 'Success',
				description: 'Knowledge base indexed successfully',
			});
		} catch (error) {
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : `Failed to index knowledge base`,
				variant: 'destructive',
			});
		}
	};

	// useEffect to fetch documents on component mount
	useEffect(() => {
		fetchDocuments();
	}, []);
	// useEffect to set hasDocuments state
	useEffect(() => {
		const subscription = form.watch((value) => {
			const knowledgeBase = value.userSettings?.knowledgeBase || [];
			setHasDocuments(
				knowledgeBase.length > 0 &&
					knowledgeBase.some(
						(doc): doc is { title: string; content: string } =>
							doc !== null &&
							doc !== undefined &&
							typeof doc.title === 'string' &&
							typeof doc.content === 'string'
					)
			);
		});

		return () => subscription.unsubscribe();
	}, [form.watch]);

	if (!user) {
		return (
			<Card>
				<CardContent className='p-6'>
					<div className='flex items-center justify-center'>
						<RefreshCw className='h-6 w-6 animate-spin' />
						<span className='ml-2'>Loading settings...</span>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className='container p-4 w-full'>
			<Card>
				<CardHeader>
					<CardTitle>Knowledge Base Settings</CardTitle>
					<CardDescription>
						Add and manage your knowledge base documents. These will be used to enhance AI responses and
						provide better context.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<SampleFormat />
					<div className='mt-6 mb-4'>
						<Accordion
							type='multiple'
							value={openSections}
							onValueChange={setOpenSections}
							className='w-full space-y-4'
						>
							{/* Default Documents Category */}
							<AccordionItem value='default-category'>
								<AccordionTrigger className='text-lg font-semibold'>Default Documents</AccordionTrigger>
								<AccordionContent>
									<div className='bg-muted p-4 rounded-md'>
										<Accordion type='multiple' className='w-full'>
											<AnimatePresence mode='wait'>
												{groupDocumentsByType(availableDocuments).default.map((doc, index) => (
													<motion.div
														key={`default-${doc.title}`}
														initial={{ opacity: 0, height: 0 }}
														animate={{ opacity: 1, height: 'auto' }}
														exit={{ opacity: 0, height: 0 }}
														transition={{ duration: 0.2 }}
													>
														<AccordionItem value={`default-${index}`}>
															<AccordionTrigger className='text-sm hover:no-underline'>
																{doc.title}
															</AccordionTrigger>
															<AccordionContent>
																<div className='pl-4 pt-2'>
																	<div className='bg-secondary p-4 rounded-md'>
																		<pre className='text-xs overflow-auto max-h-[200px] whitespace-pre-wrap break-words'>
																			{doc.content}
																		</pre>
																	</div>
																</div>
															</AccordionContent>
														</AccordionItem>
													</motion.div>
												))}
											</AnimatePresence>
										</Accordion>
									</div>
								</AccordionContent>
							</AccordionItem>

							{/* User Documents Category */}
							{groupDocumentsByType(availableDocuments).user.length > 0 && (
								<AccordionItem value='user-category'>
									<AccordionTrigger className='text-lg font-semibold'>
										Your Documents
									</AccordionTrigger>
									<AccordionContent>
										<div className='bg-muted p-4 rounded-md'>
											<Accordion type='multiple' className='w-full'>
												<AnimatePresence mode='wait'>
													{groupDocumentsByType(availableDocuments).user.map((doc, index) => (
														<motion.div
															key={`user-${doc.title}`}
															initial={{ opacity: 0, height: 0 }}
															animate={{ opacity: 1, height: 'auto' }}
															exit={{ opacity: 0, height: 0 }}
															transition={{ duration: 0.2 }}
														>
															<AccordionItem value={`user-${index}`}>
																<AccordionTrigger className='text-sm hover:no-underline'>
																	{doc.title}
																</AccordionTrigger>
																<AccordionContent>
																	<div className='pl-4 pt-2'>
																		<div className='bg-secondary p-4 rounded-md'>
																			<pre className='text-xs overflow-auto max-h-[200px] whitespace-pre-wrap break-words'>
																				{doc.content}
																			</pre>
																		</div>
																		<div className='mt-2 flex justify-end'>
																			<Button
																				type='button'
																				variant='destructive'
																				size='sm'
																				onClick={(e) => {
																					e.preventDefault();
																					deleteDocument(doc.title);
																				}}
																				disabled={isProcessing}
																			>
																				<Trash className='h-4 w-4 mr-2' />
																				Delete Document
																			</Button>
																		</div>
																	</div>
																</AccordionContent>
															</AccordionItem>
														</motion.div>
													))}
												</AnimatePresence>
											</Accordion>
										</div>
									</AccordionContent>
								</AccordionItem>
							)}
						</Accordion>
					</div>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
							<div className='space-y-4'>
								<AnimatePresence mode='popLayout'>
									{form.watch('userSettings.knowledgeBase').map((_, index) => (
										<motion.div
											key={index}
											layout
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -20 }}
											transition={{ duration: 0.2 }}
											className='grid gap-4 border p-4 rounded-lg'
										>
											<FormField
												control={form.control}
												name={`userSettings.knowledgeBase.${index}.title`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>Document Title</FormLabel>
														<FormControl>
															<Input {...field} placeholder='Enter document title' />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name={`userSettings.knowledgeBase.${index}.content`}
												render={({ field }) => (
													<FormItem>
														<FormLabel>Content (Markdown)</FormLabel>
														<FormControl>
															<Textarea
																{...field}
																placeholder='Enter markdown content'
																className='min-h-[200px]'
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<Button
												type='button'
												variant='destructive'
												size='sm'
												onClick={() => {
													const knowledgeBase = form.getValues('userSettings.knowledgeBase');
													knowledgeBase.splice(index, 1);
													form.setValue('userSettings.knowledgeBase', knowledgeBase);
												}}
											>
												<Trash className='h-4 w-4 mr-2' />
												Remove Document
											</Button>
										</motion.div>
									))}
								</AnimatePresence>
							</div>
							<motion.div layout className='flex flex-col md:flex-row gap-2 md:flex-wrap max-w-full'>
								<Button
									type='button'
									variant='outline'
									onClick={() => {
										const knowledgeBase = form.getValues('userSettings.knowledgeBase');
										form.setValue('userSettings.knowledgeBase', [
											...knowledgeBase,
											{ title: '', content: '' },
										]);
									}}
								>
									Add Document
								</Button>

								<Button
									type='submit'
									disabled={isProcessing || !hasDocuments}
									className={!hasDocuments ? 'opacity-50 cursor-not-allowed' : ''}
								>
									{isProcessing ? (
										<>
											<RefreshCw className='h-4 w-4 mr-2 animate-spin' />
											Processing...
										</>
									) : (
										<>
											<Save className='h-4 w-4 mr-2' />
											Save Knowledge Base
										</>
									)}
								</Button>

								<Button
									type='button'
									variant='destructive'
									onClick={() => setShowResetAlert(true)}
									disabled={isProcessing}
								>
									Reset Vector DB
								</Button>

								<Button
									type='button'
									variant='outline'
									onClick={() => setShowIndexAlert(true)}
									disabled={isProcessing}
								>
									Index Knowledge Base
								</Button>
							</motion.div>
						</form>
					</Form>
				</CardContent>
				<AlertDialog open={showResetAlert} onOpenChange={setShowResetAlert}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This action will permanently delete all vector embeddings from the database. This
								process cannot be undone and may affect AI responses until the knowledge base is
								re-indexed.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => {
									setShowResetAlert(false);
									handleRestKnowledgeBase();
								}}
							>
								Reset Database
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				<AlertDialog open={showIndexAlert} onOpenChange={setShowIndexAlert}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Confirm Indexing</AlertDialogTitle>
							<AlertDialogDescription>
								This will process all documents and create new vector embeddings. This operation may
								take some time and will replace existing embeddings. Are you sure you want to continue?
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => {
									setShowIndexAlert(false);
									indexKnowledgeBase();
								}}
							>
								Index Documents
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</Card>
		</Card>
	);
}
