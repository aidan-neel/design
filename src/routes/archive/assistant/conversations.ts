/** Mock data for the /assistant demo page. Nothing here talks to a real model. */

export type RichReply = 'churn-analysis' | 'cs-note';

export type Message = {
	id: number;
	role: 'user' | 'assistant';
	text: string;
	/** Canned answers with tables or drafts that plain text can't express. */
	rich?: RichReply;
	status: 'thinking' | 'streaming' | 'done';
};

export type HistoryGroup = 'Today' | 'Yesterday' | 'Previous 7 days';

export type Conversation = {
	id: string;
	title: string;
	group: HistoryGroup;
	messages: Message[];
};

export const historyGroups: readonly HistoryGroup[] = ['Today', 'Yesterday', 'Previous 7 days'];

export const models = [
	{ value: 'halo-2-pro', label: 'Halo 2 Pro', hint: 'Best for analysis' },
	{ value: 'halo-2', label: 'Halo 2', hint: 'Fast for everyday work' },
	{ value: 'halo-2-mini', label: 'Halo 2 Mini', hint: 'Quickest answers' }
] as const;

export const suggestions = [
	{ icon: 'chart', label: 'Compare October churn with September' },
	{ icon: 'pen', label: 'Draft release notes for v4.12' },
	{ icon: 'code', label: 'Explain the webhook retry backoff' },
	{ icon: 'file', label: 'Summarize the latest customer interviews' }
] as const;

export const streamedReply =
	'Got it. Starter churn for October is tracking at 2.6% so far, down from 3.4% in September. ' +
	'The dunning emails that shipped on Oct 9 recovered 14 of the 23 failed renewals, ' +
	'and price-related cancellations fell from 41 to 19. Want me to break this down by signup cohort?';

let nextMessageId = 100;

export function createMessage(role: Message['role'], text: string, status: Message['status']): Message {
	nextMessageId += 1;
	return { id: nextMessageId, role, text, status };
}

function textExchange(id: number, question: string, answer: string): Message[] {
	return [
		{ id, role: 'user', text: question, status: 'done' },
		{ id: id + 1, role: 'assistant', text: answer, status: 'done' }
	];
}

export function createConversations(): Conversation[] {
	return [
		{
			id: 'churn',
			title: 'September churn review',
			group: 'Today',
			messages: [
				{
					id: 1,
					role: 'user',
					text: 'Why did logo churn jump in September? Use the billing export and the cancellation survey.',
					status: 'done'
				},
				{ id: 2, role: 'assistant', text: '', rich: 'churn-analysis', status: 'done' },
				{
					id: 3,
					role: 'user',
					text: 'Draft a short note to the CS team with the two actions.',
					status: 'done'
				},
				{ id: 4, role: 'assistant', text: '', rich: 'cs-note', status: 'done' }
			]
		},
		{
			id: 'onboarding',
			title: 'Onboarding email sequence',
			group: 'Today',
			messages: textExchange(
				10,
				'Tighten the day-3 onboarding email. It reads too long.',
				'Cut it to three sentences: one win they can get today, a link to the import guide, and a reply-to for questions. I removed the feature list since day 1 already covers it.'
			)
		},
		{
			id: 'hiring',
			title: 'Q4 hiring plan',
			group: 'Yesterday',
			messages: textExchange(
				20,
				'What roles should we open first in Q4?',
				'Open the second support engineer first. Ticket volume grew 38% since July while the team stayed at four, and first-response time slipped from 2h to 5h.'
			)
		},
		{
			id: 'postgres',
			title: 'Postgres index for events table',
			group: 'Yesterday',
			messages: textExchange(
				30,
				'The events query takes 2.4s. Which index would help?',
				'Add a composite index on (workspace_id, created_at DESC). The planner is doing a sequential scan on 18M rows because the current index only covers workspace_id.'
			)
		},
		{
			id: 'pricing-copy',
			title: 'Pricing page copy review',
			group: 'Previous 7 days',
			messages: textExchange(
				40,
				'Is the Pro tier description clear?',
				'Mostly. "Unlimited seats" is buried in the fourth bullet. Lead with it, since it is the main reason teams upgrade from Starter.'
			)
		},
		{
			id: 'board',
			title: 'Board update outline',
			group: 'Previous 7 days',
			messages: textExchange(
				50,
				'Outline the November board update.',
				'Five sections: highlights, revenue and churn, product shipped, hiring, and asks. Keep churn honest: lead with the September spike and what fixed it.'
			)
		},
		{
			id: 'webhooks',
			title: 'Webhook retry logic',
			group: 'Previous 7 days',
			messages: textExchange(
				60,
				'How many times do we retry failed webhooks?',
				'Eight attempts with exponential backoff, starting at 30 seconds and capped at 6 hours. After the last attempt the endpoint is disabled and the owner gets an email.'
			)
		},
		{
			id: 'interviews',
			title: 'Customer interview synthesis',
			group: 'Previous 7 days',
			messages: textExchange(
				70,
				'What came up most in last week’s interviews?',
				'Reporting. Six of nine customers export to spreadsheets every week because saved views can’t be shared with people outside the workspace.'
			)
		}
	];
}
