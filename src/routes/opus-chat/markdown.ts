/**
 * A small Markdown subset for assistant replies: paragraphs, headings, lists,
 * fenced code, **bold** and `code`. It returns plain tokens that Svelte renders
 * as text, so nothing from a reply is ever injected as HTML.
 */

export type Inline = { kind: 'text' | 'bold' | 'code'; value: string };

export type Block =
	| { kind: 'paragraph'; lines: Inline[][] }
	| { kind: 'heading'; inlines: Inline[] }
	| { kind: 'list'; ordered: boolean; items: Inline[][] }
	| { kind: 'code'; language: string; code: string };

const FENCE = '```';
const HEADING = /^#{1,3} /;
const ORDERED_ITEM = /^\d+\. /;
const UNORDERED_ITEM = /^- /;

export function parseMarkdown(source: string): Block[] {
	const lines = source.split('\n');
	const blocks: Block[] = [];
	let index = 0;

	while (index < lines.length) {
		const line = lines[index];

		if (line.startsWith(FENCE)) {
			const code: string[] = [];
			index += 1;
			while (index < lines.length && !lines[index].startsWith(FENCE)) {
				code.push(lines[index]);
				index += 1;
			}
			index += 1;
			blocks.push({ kind: 'code', language: line.slice(FENCE.length).trim(), code: code.join('\n') });
			continue;
		}

		if (line.trim() === '') {
			index += 1;
			continue;
		}

		if (HEADING.test(line)) {
			blocks.push({ kind: 'heading', inlines: parseInline(line.replace(HEADING, '')) });
			index += 1;
			continue;
		}

		const itemPattern = ORDERED_ITEM.test(line) ? ORDERED_ITEM : UNORDERED_ITEM.test(line) ? UNORDERED_ITEM : null;
		if (itemPattern) {
			const items: Inline[][] = [];
			while (index < lines.length && itemPattern.test(lines[index])) {
				items.push(parseInline(lines[index].replace(itemPattern, '')));
				index += 1;
			}
			blocks.push({ kind: 'list', ordered: itemPattern === ORDERED_ITEM, items });
			continue;
		}

		const paragraph: Inline[][] = [];
		while (index < lines.length && isParagraphLine(lines[index])) {
			paragraph.push(parseInline(lines[index]));
			index += 1;
		}
		blocks.push({ kind: 'paragraph', lines: paragraph });
	}

	return blocks;
}

function isParagraphLine(line: string): boolean {
	return line.trim() !== '' && !line.startsWith(FENCE) && !HEADING.test(line) && !ORDERED_ITEM.test(line) && !UNORDERED_ITEM.test(line);
}

const INLINE_TOKEN = /(\*\*[^*]+\*\*|`[^`]+`)/g;

function parseInline(text: string): Inline[] {
	return text
		.split(INLINE_TOKEN)
		.filter((part) => part !== '')
		.map((part): Inline => {
			if (part.startsWith('**') && part.endsWith('**')) return { kind: 'bold', value: part.slice(2, -2) };
			if (part.startsWith('`') && part.endsWith('`')) return { kind: 'code', value: part.slice(1, -1) };
			// An unclosed marker means the bold text is still streaming in; hide it until it closes.
			return { kind: 'text', value: part.replaceAll('**', '') };
		});
}

