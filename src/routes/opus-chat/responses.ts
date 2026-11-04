import type { Attachment, Source } from './data';

/** What the canned "model" says back. There is no backend, so replies are picked by topic. */
export type CannedReply = { text: string; sources: Source[] };

type Topic = {
	matches: RegExp;
	variants: readonly string[];
	sources: readonly Source[];
};

const TOPICS: readonly Topic[] = [
	{
		matches: /\b(sql|query|index|postgres|bug|function|regex|typescript|javascript|code|error|api)\b/i,
		variants: [
			`Here is how I would approach it. Start by making the slow path measurable, then change one thing at a time.

\`\`\`ts
export async function timed<T>(label: string, run: () => Promise<T>): Promise<T> {
  const started = performance.now();
  try {
    return await run();
  } finally {
    console.info(\`\${label} took \${Math.round(performance.now() - started)}ms\`);
  }
}
\`\`\`

1. **Wrap the suspect call** in \`timed()\` and run it against production-sized data.
2. **Look at the plan or profile,** not the code, to find where the time goes.
3. **Fix the biggest cost first.** It is usually a missing index, an N+1 loop, or a large payload.

Paste the output here and I will tell you which of the three it is.`,
			`The quickest way to narrow this down is to reproduce it in isolation.

\`\`\`ts
const cases = [
  { input: 'DE123456789', expected: true },
  { input: 'DE12345678', expected: false },
  { input: ' fr 12 345678901 ', expected: true }
];

for (const { input, expected } of cases) {
  console.assert(validate(input) === expected, \`failed on "\${input}"\`);
}
\`\`\`

Run it, and any failing case prints its input. Most bugs of this kind come from **input that was never normalised**: stray spaces, lowercase letters or a missing prefix. Fix the normalisation at the boundary and the core logic usually stays simple.`
		],
		sources: [
			{ title: 'Multicolumn indexes', domain: 'postgresql.org', url: 'https://www.postgresql.org/docs/current/indexes-multicolumn.html' },
			{ title: 'Using EXPLAIN', domain: 'postgresql.org', url: 'https://www.postgresql.org/docs/current/using-explain.html' },
			{ title: 'performance.now()', domain: 'developer.mozilla.org', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Performance/now' }
		]
	},
	{
		matches: /\b(email|reply|message|draft|respond|write to|follow up)\b/i,
		variants: [
			`Here is a draft you can send as is or adjust:

**Subject:** Following up on our call

Hi Sam,

Thanks for the time on Tuesday. As promised, here are the two things we agreed on:

- We will move your workspace to annual billing from **December 1**, at the rate we discussed.
- Our team will run the data import on **November 18**, and you will get a summary when it finishes.

If either date does not work, reply here and I will move it.

Best,
Nadia

Want a shorter version for Slack?`,
			`A shorter, more direct version:

Hi Sam,

Quick confirmation after Tuesday: annual billing starts **December 1**, and the data import runs on **November 18**. I will send a summary once it is done.

Let me know if either date needs to move.

Nadia`
		],
		sources: [
			{ title: 'Writing effective follow-up emails', domain: 'hbr.org', url: 'https://hbr.org/topic/subject/communication' },
			{ title: 'Plain language guidelines', domain: 'plainlanguage.gov', url: 'https://www.plainlanguage.gov/guidelines/' }
		]
	},
	{
		matches: /\b(plan|agenda|trip|offsite|itinerary|schedule|week|roadmap)\b/i,
		variants: [
			`Here is a plan that leaves room for things to slip:

1. **Day 1, morning:** set the goal and agree on what "done" looks like.
2. **Day 1, afternoon:** split the work into blocks of half a day or less.
3. **Day 2:** do the riskiest block first, while there is still time to change course.
4. **Day 3, morning:** finish the remaining blocks.
5. **Day 3, afternoon:** review, write down what is left, and decide who owns it.

Keep the last half-day free. Something always takes longer than planned.`,
			`A lighter version with fewer fixed slots:

- **Start of each day:** 15 minutes to pick the one thing that has to happen.
- **Before lunch:** deep work on that one thing, notifications off.
- **After lunch:** meetings, reviews and small tasks.
- **End of day:** write tomorrow's one thing before you log off.

It works best when the whole team uses the same rhythm.`
		],
		sources: [
			{ title: 'Time blocking', domain: 'todoist.com', url: 'https://todoist.com/productivity-methods/time-blocking' },
			{ title: 'How to run an offsite', domain: 'firstround.com', url: 'https://review.firstround.com/' }
		]
	},
	{
		matches: /\b(summar|tl;?dr|recap|key points|bullets)/i,
		variants: [
			`The short version, in five points:

- **The main claim** is that the current approach costs more than it saves.
- **The evidence** is three months of usage data, not a survey.
- **The proposal** is to replace it in two phases over one quarter.
- **The risk** is the migration in phase two, which touches billing.
- **The ask** is a decision by the end of the month.

The section worth reading in full is the risk section. The rest is background.`,
			`One paragraph:

The document argues for replacing the current setup in two phases over a quarter, based on three months of usage data. The first phase is low risk. The second touches billing and needs careful testing. It asks for a decision by the end of the month.`
		],
		sources: [
			{ title: 'How to write a one-page summary', domain: 'atlassian.com', url: 'https://www.atlassian.com/work-management' }
		]
	},
	{
		matches: /\b(explain|what is|what's|how does|why does|why is|difference between)\b/i,
		variants: [
			`Here is the plain version.

It works in two steps. First, the system collects everything it needs up front, so nothing has to be fetched halfway through. Then it does the work in one pass and hands back the result.

**Why it matters:** splitting the "collect" and "do" steps means each one can be tested and sped up on its own.

**A good analogy:** a chef who reads the whole recipe and lays out every ingredient before turning on the stove.

Want me to go one level deeper, or give an example from your codebase?`,
			`Short answer: it trades a little extra work up front for much less work later.

Longer answer: instead of figuring things out as it goes, it prepares everything first. That costs a moment at the start, but it avoids repeating the same work again and again, which is where most of the time used to go.

If you tell me who the explanation is for, I can pitch it at the right level.`
		],
		sources: [
			{ title: 'Explaining technical concepts', domain: 'developers.google.com', url: 'https://developers.google.com/tech-writing' }
		]
	}
];

const FALLBACK_VARIANTS: readonly string[] = [
	`Here is where I would start with "{prompt}":

1. **Pin down the outcome.** What should be true when this is done?
2. **List what you already know,** and mark anything you are guessing at.
3. **Pick the smallest next step** that would tell you if you are on the right track.

If you share a bit more context, such as who this is for and any constraints, I can make this specific.`,
	`A different angle on "{prompt}":

Work backwards from the result. Write down what the finished version looks like in one sentence, then list the two or three things that have to be true for it to exist. Whatever is least certain on that list is what to work on first.

Tell me more and I can turn this into a concrete plan.`
];

const FALLBACK_SOURCES: readonly Source[] = [
	{ title: 'Working backwards', domain: 'aboutamazon.com', url: 'https://www.aboutamazon.com/news/workplace' }
];

export function composeReply(prompt: string, attachments: readonly Attachment[], attempt: number, withSources: boolean): CannedReply {
	const topic = TOPICS.find((candidate) => candidate.matches.test(prompt));
	const variants = topic?.variants ?? FALLBACK_VARIANTS;
	const body = variants[attempt % variants.length].replaceAll('{prompt}', shorten(prompt));
	const text = attachments.length > 0 ? `${describeAttachments(attachments)}\n\n${body}` : body;

	const sources = withSources ? [...(topic?.sources ?? FALLBACK_SOURCES)] : [];
	return { text, sources };
}

function describeAttachments(attachments: readonly Attachment[]): string {
	const names = attachments.map((attachment) => `**${attachment.name}**`);
	const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
	return `I read ${list}. Here is what stands out.`;
}

const PROMPT_PREVIEW_LENGTH = 60;

function shorten(prompt: string): string {
	const oneLine = prompt.replace(/\s+/g, ' ').trim();
	return oneLine.length > PROMPT_PREVIEW_LENGTH ? `${oneLine.slice(0, PROMPT_PREVIEW_LENGTH).trimEnd()}…` : oneLine;
}

const TITLE_WORDS = 6;

/** A short sidebar title from the first prompt, the way a real product would before a model names it. */
export function titleFromPrompt(prompt: string): string {
	const words = prompt.replace(/\s+/g, ' ').trim().split(' ').slice(0, TITLE_WORDS).join(' ');
	const cleaned = words.replace(/[.,:;!?]+$/, '');
	return cleaned.charAt(0).toUpperCase() + cleaned.slice(1) || 'New chat';
}
