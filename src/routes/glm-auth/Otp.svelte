<script lang="ts">
	let {
		oncomplete,
		disabled = false
	}: {
		oncomplete: (code: string) => void;
		disabled?: boolean;
	} = $props();

	const N = 6;
	let vals = $state<string[]>(Array<string>(N).fill(''));
	let inputs: HTMLInputElement[] = $state([]);
	let timer: ReturnType<typeof setTimeout> | undefined;

	export function value(): string {
		return vals.join('');
	}

	export function clear() {
		vals = Array<string>(N).fill('');
		requestAnimationFrame(() => inputs[0]?.focus());
	}

	function commit() {
		const code = vals.join('');
		if (code.length !== N) return;
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => oncomplete(code), 60);
	}

	function oninput(i: number, e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		const digits = el.value.replace(/\D/g, '');
		vals[i] = digits ? digits.slice(-1) : '';
		el.value = vals[i];
		if (vals[i] && i < N - 1) inputs[i + 1]?.focus();
		commit();
	}

	function onkeydown(i: number, e: KeyboardEvent) {
		if (e.key === 'Backspace') {
			if (!vals[i] && i > 0) {
				e.preventDefault();
				vals[i - 1] = '';
				inputs[i - 1]?.focus();
			}
		} else if (e.key === 'ArrowLeft' && i > 0) {
			e.preventDefault();
			inputs[i - 1]?.focus();
		} else if (e.key === 'ArrowRight' && i < N - 1) {
			e.preventDefault();
			inputs[i + 1]?.focus();
		}
	}

	function onpaste(i: number, e: ClipboardEvent) {
		e.preventDefault();
		const text = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, N);
		if (!text) return;
		for (let k = 0; k < N; k++) vals[k] = k < text.length ? text[k] : '';
		inputs[Math.min(text.length, N - 1)]?.focus();
		commit();
	}
</script>

<div class="otp" role="group" aria-label="6-digit verification code">
	{#each vals as v, i (i)}
		<input
			data-autofocus={i === 0 ? '' : undefined}
			bind:this={inputs[i]}
			value={v}
			type="text"
			inputmode="numeric"
			autocomplete={i === 0 ? 'one-time-code' : 'off'}
			maxlength={1}
			aria-label={'Digit ' + (i + 1) + ' of ' + N}
			{disabled}
			oninput={(e) => oninput(i, e)}
			onkeydown={(e) => onkeydown(i, e)}
			onpaste={(e) => onpaste(i, e)}
		/>
	{/each}
</div>

<style>
	.otp {
		display: flex;
		gap: 8px;
	}
	input {
		width: 48px;
		height: 54px;
		border: 0;
		border-radius: 10px;
		background: #fff;
		box-shadow: 0 1px 2px rgb(40 40 40 / 0.08), 0 0 0 1px var(--line, #ececec);
		text-align: center;
		font-family: inherit;
		font-size: 20px;
		font-weight: 500;
		font-variant-numeric: tabular-nums;
		color: var(--fg, #171717);
		caret-color: var(--accent, #255cd1);
		transition: box-shadow 150ms cubic-bezier(0.23, 1, 0.32, 1);
	}
	input:focus {
		outline: none;
		box-shadow: 0 0 0 1px var(--accent, #255cd1), 0 0 0 4px var(--ring, rgb(37 92 209 / 0.28));
	}
	input:disabled {
		opacity: 0.55;
	}
	@media (max-width: 480px) {
		input {
			width: 44px;
			height: 52px;
		}
	}
</style>
