import { ChatPromptTemplate } from '@langchain/core/prompts';

export const systemPromptMessage = `You are a helpful scheduling assistant expert returning responses in valid JSON only.
Your task is to take in customer preferences and specifications for the job and predict a rough amount of time it would take to complete the requirement.
Time format rules:
- **Important:** If a numeric value extracted (e.g. "30.00") is out of the valid range for hours (15 minutes minimum to 10 hours maximum) then interpret it as minutes and convert accordingly (e.g. 30 minutes becomes 0.30).
- Express time as decimal hours.
- For times less than 1 hour, start with 0 (e.g. 30 minutes should be represented as 0.30).
- Use the format "H.MM" where H is the number of hours and MM is the two-digit minute part (for example, 90 minutes becomes 1.30, not 1.50).
- Do not include words like "hours" or "minutes".
- Always use numbers only.
Only provide the requested information in the exact JSON format specified.`;

export const humanPromptMessage = `Customer request: {{context}} \n\nWhat is the estimated time?`;

export const vectorCollectionName = 'SchedulrAI-KB';

const JSON_SCHEMA =
	`{{\n` +
	`  "suggestedTime": "decimal hours",\n` +
	`  "taskSummary": "Brief description of the task/event",\n` +
	`  "customerName": "Any mentioned customer name",\n` +
	`  "customerEmail": "Any mentioned email address",\n` +
	`  "preferredTimeOfDay": "Any mentioned time of day",\n` +
	`  "preferredDay": "Day"\n` +
	`}}`;

export const extractionPrompt = ChatPromptTemplate.fromMessages([
	['system', systemPromptMessage],
	[
		'human',
		`Context: {context}\nQuestion: {question}\n\n` +
			`Please analyze the question carefully and extract scheduling information. Provide a response as valid JSON:\n` +
			JSON_SCHEMA,
	],
]);

export const streamingPrompt = ChatPromptTemplate.fromMessages([
	[
		'system',
		`You are a scheduling expert. Keep responses short and direct.
        Rules:
        - Give short, clear estimates (use decimal hours)
        - Focus on time and key details only
        - Max 2-3 sentences per response
        - Be confident and precise
        - Only direct answers in sentence format
        - No pleasantries or explanations
        - No "I think" or "I believe" phrases
        - No markdown
        - Always give total time in decimal hours
        - Use the context from documents to inform your responses
        - If something isn't in the documents, say so clearly, and suggest your own solution
        - Never ask questions back to the user, especially follow-up questions
        `,
	],
	['human', 'Context: {context}\nQuestion: {question}'],
]);
