import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export function SampleFormat() {
	return (
		<Accordion type='single' collapsible className='w-full'>
			<AccordionItem value='sample-format'>
				<AccordionTrigger className='text-sm hover:no-underline'>
					Example for your custom knowledge base document.
				</AccordionTrigger>
				<AccordionContent>
					<div className='pl-4 pt-2'>
						<div className='bg-secondary p-4 rounded-md'>
							<pre className='text-xs overflow-auto max-h-[400px]'>
								{`# Request
- This is a sample request that shows how to structure your custom knowledge base document.
- Include relevant details, specific requirements, and any additional information that would help understand the context.
- Keep the format clear and organized for better processing.

## Breakdown:

- Main Service: Duration
- Additional Service: Duration
- Consultation Time: Duration
- Other Requirements: Duration
- Total Time: X hours
---`}
							</pre>
						</div>
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
