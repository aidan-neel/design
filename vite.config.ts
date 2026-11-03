import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

// Generated outputs are never hand-edited, so the site-wide +2px text bump is applied
// to them at build time: scoped `font-size: Npx` and `text-[Npx]` utilities.
const TEXT_BUMP = 2;
const bumpOutputText = (): Plugin => ({
	name: 'bump-output-text',
	enforce: 'pre',
	transform(code, id) {
		if (!/\/src\/lib\/outputs\/.+\.svelte$/.test(id.split('?')[0])) return;
		return code
			.replace(/font-size:\s*(\d+(?:\.\d+)?)px/g, (_, n) => `font-size: ${+n + TEXT_BUMP}px`)
			.replace(/text-\[(\d+(?:\.\d+)?)px\]/g, (_, n) => `text-[${+n + TEXT_BUMP}px]`);
	}
});

export default defineConfig({
	plugins: [
		bumpOutputText(),
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	]
});
