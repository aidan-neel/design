export type ModelId = 'halden-4' | 'halden-4-pro' | 'halden-4-swift';

export type Model = {
	id: ModelId;
	name: string;
	description: string;
	/** Pause before the first token, so each model feels different. */
	thinkMs: number;
	/** Delay between streamed chunks. */
	tickMs: number;
};

export const MODELS: readonly Model[] = [
	{
		id: 'halden-4',
		name: 'Halden 4',
		description: 'Balanced for everyday work',
		thinkMs: 700,
		tickMs: 28
	},
	{
		id: 'halden-4-pro',
		name: 'Halden 4 Pro',
		description: 'Reasons longer on hard problems',
		thinkMs: 1800,
		tickMs: 36
	},
	{
		id: 'halden-4-swift',
		name: 'Halden 4 Swift',
		description: 'Fastest replies, lighter reasoning',
		thinkMs: 300,
		tickMs: 14
	}
];

export function findModel(id: ModelId): Model {
	const model = MODELS.find((candidate) => candidate.id === id);
	if (!model) throw new Error(`Unknown model "${id}"`);
	return model;
}

export type WorkspaceId = 'northwind' | 'personal';

export type Workspace = { id: WorkspaceId; name: string; initial: string; tint: string };

export const WORKSPACES: readonly Workspace[] = [
	{ id: 'northwind', name: 'Northwind Labs', initial: 'N', tint: '#2f5bd3' },
	{ id: 'personal', name: 'Personal', initial: 'P', tint: '#171717' }
];

export type AttachmentKind = 'image' | 'pdf' | 'code' | 'sheet' | 'doc';

export type Attachment = {
	id: string;
	name: string;
	size: number;
	kind: AttachmentKind;
	previewUrl?: string;
};

export type Source = { title: string; domain: string; url: string };

export type ReplyStatus = 'thinking' | 'streaming' | 'done' | 'stopped';

export type Reply = {
	text: string;
	/** The full canned answer; `text` grows toward it while streaming. */
	target: string;
	model: ModelId;
	status: ReplyStatus;
	sources: Source[];
	createdAt: number;
};

export type UserMessage = {
	id: string;
	role: 'user';
	text: string;
	attachments: Attachment[];
	createdAt: number;
};

export type AssistantMessage = {
	id: string;
	role: 'assistant';
	replies: Reply[];
	replyIndex: number;
	feedback: 'up' | 'down' | null;
};

export type Message = UserMessage | AssistantMessage;

export type Conversation = {
	id: string;
	workspaceId: WorkspaceId;
	title: string;
	pinned: boolean;
	archived: boolean;
	updatedAt: number;
	messages: Message[];
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

let seedCounter = 0;
function seedId(prefix: string): string {
	seedCounter += 1;
	return `${prefix}-seed-${seedCounter}`;
}

function user(text: string, createdAt: number, attachments: Attachment[] = []): UserMessage {
	return { id: seedId('m'), role: 'user', text, attachments, createdAt };
}

function assistant(text: string, createdAt: number, model: ModelId = 'halden-4', sources: Source[] = []): AssistantMessage {
	return {
		id: seedId('m'),
		role: 'assistant',
		replies: [{ text, target: text, model, status: 'done', sources, createdAt }],
		replyIndex: 0,
		feedback: null
	};
}

type SeedTurn = { ask: string; answer: string; model?: ModelId; attachments?: Attachment[]; sources?: Source[] };

function conversation(
	workspaceId: WorkspaceId,
	title: string,
	ageMs: number,
	turns: SeedTurn[],
	options: { pinned?: boolean } = {}
): Conversation {
	const updatedAt = Date.now() - ageMs;
	const messages = turns.flatMap((turn, index) => {
		const at = updatedAt - (turns.length - index) * 3 * MINUTE;
		return [user(turn.ask, at, turn.attachments), assistant(turn.answer, at + MINUTE, turn.model, turn.sources)];
	});
	return { id: seedId('c'), workspaceId, title, pinned: options.pinned ?? false, archived: false, updatedAt, messages };
}

const ORDERS_ANSWER = `The planner is scanning \`orders\` because nothing covers the filter and the sort together. Your query filters on \`account_id\` and \`status\`, then sorts by \`created_at\`, so a composite index in that order lets Postgres read the newest rows straight off the index and stop at 50.

\`\`\`sql
CREATE INDEX CONCURRENTLY orders_account_status_created_idx
  ON orders (account_id, status, created_at DESC);
\`\`\`

A few things to check before you ship it:

1. **Build it concurrently.** \`CONCURRENTLY\` keeps writes to \`orders\` flowing while it builds.
2. **Confirm the plan** with \`EXPLAIN (ANALYZE, BUFFERS)\`. You want an Index Scan with no Sort node above it.
3. **Drop the old index** afterwards. \`orders_account_id_idx\` has the same leading column, so it only costs you write time.

On a table your size (about 41M rows) expect the build to take 6 to 10 minutes.`;

const ORDERS_FOLLOWUP = `Yes, a partial index is a good fit here because 94% of rows are \`fulfilled\` and you never page through those.

\`\`\`sql
CREATE INDEX CONCURRENTLY orders_open_by_account_idx
  ON orders (account_id, created_at DESC)
  WHERE status IN ('pending', 'processing');
\`\`\`

It will be roughly 15x smaller than the full composite index, which keeps it in memory. The catch is that the planner only uses it when your query repeats the same \`WHERE status IN (...)\` condition, so keep the literal list identical in the app code.`;

const PRICING_ANSWER = `Here is a tighter version. I kept your three tiers and cut every line that described a feature instead of an outcome.

### Starter, $0
For trying Northwind on one project. Up to 3 seats and 1,000 tracked events a month.

### Team, $24 per seat
For teams shipping weekly. Unlimited projects, 2M events, and alerts in Slack when a release changes conversion.

### Scale, talk to us
For companies with compliance needs. SSO, audit logs, a 99.95% uptime SLA and a named support engineer.

Two notes: "per seat" reads better than "/user/mo" on mobile, and I moved the SLA into Scale because it is the main reason people upgrade.`;

const REFUND_ANSWER = `Here is a reply that gives the refund without inviting a back-and-forth:

**Subject:** Your refund for invoice #4471

Hi Dana,

Thanks for flagging this. You were charged for 18 seats after you removed 6 of them on September 30, which is our mistake. I have refunded **$432.00** to the card ending in 2291. It usually appears within 5 to 7 business days.

Your next invoice on November 1 will show 12 seats.

Best,
Priya

Want me to make it warmer, or add a line about the seat-sync fix shipping next week?`;

const RSC_ANSWER = `Here is a version for someone in their first week:

**React Server Components** run on the server and send the browser a description of the UI, not JavaScript. The browser only downloads code for the parts that need to be interactive.

**Streaming** means the server does not wait for the whole page. It sends the shell first, then fills in each slow part as its data arrives.

A useful way to picture it:

- The page is a form with several fields.
- The server sends the form right away with "loading" in the slow fields.
- Each field is filled in the moment its answer is ready, in whatever order they finish.

The practical rule for new hires: put data fetching in server components, and wrap anything slow in a \`<Suspense>\` boundary so it does not hold up the rest of the page.`;

const VAT_ANSWER = `Each EU country has its own format, so a single loose pattern lets a lot of invalid numbers through. This one checks the country prefix and the length rules for the six markets you sell in:

\`\`\`ts
const EU_VAT = /^(DE\\d{9}|FR[A-HJ-NP-Z0-9]{2}\\d{9}|NL\\d{9}B\\d{2}|ES[A-Z0-9]\\d{7}[A-Z0-9]|IT\\d{11}|PL\\d{10})$/;

export function isValidVat(input: string): boolean {
  return EU_VAT.test(input.replace(/[\\s.-]/g, '').toUpperCase());
}
\`\`\`

The regex only checks the shape. For checkout, also call the EU's VIES service, since a well-formed number can still be unregistered.`;

const BOARD_ANSWER = `A structure that fits on six slides:

1. **Headline.** ARR at $4.8M, up 31% on Q2, with net revenue retention at 118%.
2. **What worked.** The Team plan launch drove 62% of new ARR.
3. **What did not.** Enterprise sales cycle stretched from 74 to 96 days.
4. **Burn and runway.** $410K net burn a month, 27 months of runway.
5. **Q4 bets.** SSO and audit logs to unblock the 9 stalled enterprise deals.
6. **Asks.** Two intros to heads of data at fintech companies.

Lead with the retention number. It is the one the board asked about last time.`;

const SOURDOUGH_ANSWER = `Working back from bread out of the oven at 12:00 on Saturday:

- **Friday 21:00:** feed the starter, 1:5:5.
- **Saturday 07:00:** mix the dough, then rest 45 minutes.
- **07:45 to 09:45:** four sets of stretch and folds, 30 minutes apart.
- **09:45 to 10:45:** let it rise until it is about 50% bigger.
- **10:45:** shape, then proof in the basket for 45 minutes.
- **11:30:** score and bake at 250°C, 20 minutes lid on, 20 minutes off.

Your kitchen runs warm (24°C), so check the dough at 10:15 rather than trusting the clock.`;

const GOAL_ANSWER = `The core idea of *The Goal* is that a system's output is set by its slowest step, so improving anything else is wasted effort.

- **Find the constraint.** In the book it is the NCX-10 machine.
- **Exploit it.** Never let the constraint sit idle, not even over lunch.
- **Subordinate everything else** to its pace.
- **Elevate it** only once the first three steps are exhausted.
- **Repeat,** because the constraint moves.

For your team, the constraint is probably code review, not engineering time. That is where a shorter queue pays back first.`;

const TRAINING_ANSWER = `Weeks 6 to 8, building to 18 km before the taper:

- **Week 6:** long run 14 km, tempo 5 km at 5:20/km, 32 km total.
- **Week 7:** long run 16 km, intervals 6 × 800 m, 35 km total.
- **Week 8:** long run 18 km, easy week otherwise, 30 km total.

Keep the long runs at conversation pace. If your left calf flares up again, swap the intervals for an easy 8 km.`;

const ONBOARDING_ANSWER = `A first-week checklist for new support hires:

1. **Day 1:** shadow two senior agents on live chat.
2. **Day 2:** read the 20 most-used macros and rewrite two of them.
3. **Day 3:** answer tier-1 tickets with review before sending.
4. **Day 4:** sit in on the bug triage call with engineering.
5. **Day 5:** take tier-1 tickets solo, with a 30-minute retro at the end.

Track one number: first-reply time on their own tickets in week two.`;

const INCIDENT_ANSWER = `Summary of the October 14 outage, in the blameless format you use:

- **Impact:** 38 minutes of failed checkouts for 12% of EU customers.
- **Trigger:** a config push lowered the payment service's connection pool from 50 to 5.
- **Detection:** alert fired after 9 minutes; the threshold was set to 5% errors.
- **Fix:** rolled back the config at 14:31 UTC.

**Follow-ups:** validate pool sizes in CI, lower the alert threshold to 2%, and add a canary stage for config pushes.`;

const LEASE_ANSWER = `Comparing the two over 12 months:

- **Rua do Norte:** €1,450 a month, €2,900 deposit, utilities included. About €17,400 a year.
- **Avenida Almirante Reis:** €1,280 a month, €3,840 deposit, utilities about €110 a month. About €16,680 a year.

Almirante Reis is about €720 a year cheaper, but its deposit is €940 higher and it has a 3-month notice period instead of 1. If you might move within a year, Rua do Norte is the safer pick.`;

const ATTACHMENT_EXAMPLE: Attachment = { id: 'att-seed-1', name: 'pricing-v2.pdf', size: 1_284_000, kind: 'pdf' };

export function createSeedConversations(): Conversation[] {
	return [
		conversation(
			'northwind',
			'Slow orders query on Postgres',
			12 * MINUTE,
			[
				{
					ask: "This query takes 4.2s on prod. What index should I add?\n\nSELECT * FROM orders WHERE account_id = $1 AND status = 'pending' ORDER BY created_at DESC LIMIT 50;",
					answer: ORDERS_ANSWER,
					model: 'halden-4-pro'
				},
				{ ask: 'Would a partial index be better? Almost everything is fulfilled.', answer: ORDERS_FOLLOWUP }
			]
		),
		conversation(
			'northwind',
			'Pricing page copy, v3',
			2 * DAY,
			[{ ask: 'Tighten the copy for our three pricing tiers. Current draft attached.', answer: PRICING_ANSWER, attachments: [ATTACHMENT_EXAMPLE] }],
			{ pinned: true }
		),
		conversation('northwind', 'Refund reply for Brightline', 2 * HOUR, [
			{ ask: 'Draft a reply to Dana at Brightline. We overcharged them for 6 seats in October.', answer: REFUND_ANSWER }
		]),
		conversation('northwind', 'Explain RSC streaming to new hires', 26 * HOUR, [
			{ ask: 'Explain React Server Components and streaming for a new hire who knows React but not the server side.', answer: RSC_ANSWER }
		]),
		conversation('northwind', 'Q3 board update outline', 3 * DAY, [
			{ ask: 'Outline our Q3 board update. Key numbers are in my notes from yesterday.', answer: BOARD_ANSWER, model: 'halden-4-pro' }
		]),
		conversation('northwind', 'EU VAT number validation', 5 * DAY, [
			{ ask: 'Regex to validate EU VAT numbers for DE, FR, NL, ES, IT and PL?', answer: VAT_ANSWER }
		]),
		conversation('northwind', 'Support onboarding checklist', 12 * DAY, [
			{ ask: 'Make a first-week checklist for new support hires.', answer: ONBOARDING_ANSWER, model: 'halden-4-swift' }
		]),
		conversation('northwind', 'Incident review: Oct 14 outage', 21 * DAY, [
			{ ask: 'Summarize the Oct 14 outage timeline into a blameless review.', answer: INCIDENT_ANSWER }
		]),
		conversation(
			'personal',
			'Sourdough schedule for Saturday',
			5 * HOUR,
			[{ ask: 'I want sourdough out of the oven at noon on Saturday. Work back the schedule.', answer: SOURDOUGH_ANSWER }],
			{ pinned: true }
		),
		conversation('personal', 'Notes on The Goal', 2 * DAY, [
			{ ask: 'Give me the core idea of The Goal by Goldratt and how it applies to a 9-person eng team.', answer: GOAL_ANSWER }
		]),
		conversation('personal', 'Half-marathon, weeks 6 to 8', 4 * DAY, [
			{ ask: 'Plan weeks 6 to 8 of my half-marathon block. Race is Dec 8.', answer: TRAINING_ANSWER, model: 'halden-4-swift' }
		]),
		conversation('personal', 'Comparing two Lisbon leases', 16 * DAY, [
			{ ask: 'Compare these two apartment leases on total cost over a year.', answer: LEASE_ANSWER }
		])
	];
}
