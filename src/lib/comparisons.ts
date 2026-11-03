export type Output = { src: string | null; tokens: number | null };

export type Variant = 'without' | 'with';

export const EMPTY_OUTPUT: Output = { src: null, tokens: null };

export type Comparison = {
	id: string;
	label: string;
	prompt: string;
	/**
	 * Generated results keyed by model value (see `models`), then variant.
	 * Missing model/variant means not generated yet.
	 */
	outputs: Partial<Record<string, Partial<Record<Variant, Output>>>>;
};

export function getOutput(c: Comparison, model: string, variant: Variant): Output {
	return c.outputs[model]?.[variant] ?? EMPTY_OUTPUT;
}

/** Every model we know about. The Model select only shows those with an output (see `models`). */
const knownModels = [
	{ value: 'glm-5.3', label: 'GLM 5.3' },
	{ value: 'glm-5.3-flash', label: 'GLM 5.3 Flash' },
	{ value: 'muse-spark-1.3', label: 'Muse Spark 1.3' },
	{ value: 'gpt-6-luna', label: 'GPT 6 Luna' },
	{ value: 'gpt-6.1-sol', label: 'GPT 6.1 Sol' },
	{ value: 'deepseek-v4.1-flash', label: 'DeepSeek V4.1 Flash' },
	{ value: 'qwen-3.8-max', label: 'Qwen 3.8 Max' },
	{ value: 'mimo-v2.6-flash', label: 'Mimo V2.6 Flash' },
	{ value: 'mimo-v2.6-pro', label: 'Mimo V2.6 Pro' },
	{ value: 'sonnet-5.5', label: 'Sonnet 5.5' },
	{ value: 'haiku-4.5', label: 'Haiku 4.5' },
	{ value: 'swe-2', label: 'SWE-2' }
];
export const SKILL_STATUS: 'placeholder' | 'ready' = 'placeholder';

export const comparisons: Comparison[] = [
	{
			id: 'button',
			label: 'Button',
			prompt: 'Build a copy button that confirms the copy happened.',
			outputs: {}
	},
	{
			id: 'select',
			label: 'Select',
			prompt: 'Build a select dropdown for choosing between a list of models.',
			outputs: {
				// Sonnet 5.5 · 2026-10-04
				'sonnet-5.5': {
					without: { src: '/src/lib/outputs/sonnet-5.5/select/without.svelte', tokens: null },
					with: { src: '/src/lib/outputs/sonnet-5.5/select/with.svelte', tokens: null }
				},
				// Muse Spark 1.3 - 2026-10-05 (with skill; without not generated)
				'muse-spark-1.3': {
					without: { src: '/src/lib/outputs/muse-spark-1.3/select/without.svelte', tokens: null },
					with: { src: '/src/lib/outputs/muse-spark-1.3/select/with.svelte', tokens: null }
				},
				// DeepSeek V4.1 Flash - 2026-10-05 (without skill; with generated 2026-10-04)
				'deepseek-v4.1-flash': {
					without: { src: '/src/lib/outputs/deepseek-v4.1-flash/select/without.svelte', tokens: null },
					with: { src: '/src/lib/outputs/deepseek-v4.1-flash/select/with.svelte', tokens: null }
				},
				// Mimo V2.6 Pro - 2026-10-05 (without skill; with generated 2026-10-05)
				'mimo-v2.6-pro': {
					without: { src: '/src/lib/outputs/mimo-v2.6-pro/select/without.svelte', tokens: null },
					with: { src: '/src/lib/outputs/mimo-v2.6-pro/select/with.svelte', tokens: null }
				},
				// SWE-2 · 2026-10-05
				'swe-2': {
					with: { src: '/src/lib/outputs/swe-2/select/with.svelte', tokens: null }
				}
			}
	},
	{
		id: 'command',
		label: 'Command',
		prompt: 'Build a command palette that opens with Cmd+K and filters a list of actions.',
		outputs: {
			// DeepSeek V4.1 Flash - 2026-10-05 (skill run; without generated 2026-10-05)
			'deepseek-v4.1-flash': {
				without: { src: '/src/lib/outputs/deepseek-v4.1-flash/command/without.svelte', tokens: null },
				with: { src: '/src/lib/outputs/deepseek-v4.1-flash/command/with.svelte', tokens: null }
			},
			// Sonnet 5.5 - 2026-10-05 (with skill; without not generated)
			'sonnet-5.5': {
				with: { src: '/src/lib/outputs/sonnet-5.5/command/with.svelte', tokens: null }
			}
		}
	}
];

/** Models that have at least one generated output, in `knownModels` order. */
export const models = knownModels.filter((m) =>
	comparisons.some((c) => Object.keys(c.outputs[m.value] ?? {}).length > 0)
);
