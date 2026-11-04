<script lang="ts">
	import '@fontsource-variable/inter';
	import './theme.css';
	import { Tooltip } from 'bits-ui';
	import type { Plan } from './data';
	import Devices from './Devices.svelte';
	import Faq from './Faq.svelte';
	import Footer from './Footer.svelte';
	import Hero from './Hero.svelte';
	import Hub from './Hub.svelte';
	import Nav from './Nav.svelte';
	import Night from './Night.svelte';
	import Planner from './Planner.svelte';
	import Pricing from './Pricing.svelte';
	import { provideRegion } from './region.svelte';
	import Reserve from './Reserve.svelte';
	import { scrollToSection } from './sections';
	import ToastRegion from './ToastRegion.svelte';
	import { provideToaster } from './toasts.svelte';

	provideRegion();
	provideToaster();

	let reservePlan = $state<Plan['id']>('home');
	let reserveNote = $state('');
	let reserveUnits = $state(40);

	function choosePlan(plan: Plan['id'], buildingUnits: number) {
		reservePlan = plan;
		reserveUnits = buildingUnits;
		scrollToSection('reserve');
	}

	function askAboutDevice(device: string) {
		reserveNote = `Does Ebb work with ${device}?`;
		scrollToSection('reserve');
	}
</script>

<svelte:head>
	<title>Ebb · Run your home on the cheapest hours</title>
	<meta
		name="description"
		content="Ebb is a hub and app that moves car charging, heating and laundry to the cheapest, cleanest hours of the grid."
	/>
</svelte:head>

<Tooltip.Provider delayDuration={500} skipDelayDuration={400}>
	<div class="ebb">
		<a class="skip-link" href="#ebb-main">Skip to content</a>
		<Nav />
		<main id="ebb-main">
			<Hero />
			<Night />
			<Planner />
			<Hub />
			<Devices onAsk={askAboutDevice} />
			<Pricing onChoose={choosePlan} />
			<Faq />
			<Reserve bind:plan={reservePlan} bind:note={reserveNote} bind:units={reserveUnits} />
		</main>
		<Footer />
		<ToastRegion />
	</div>
</Tooltip.Provider>

<style>
	.skip-link {
		position: fixed;
		top: 12px;
		left: 12px;
		z-index: 90;
		padding: 10px 14px;
		border-radius: 10px;
		background: var(--ink);
		color: #fff;
		font-size: 14px;
		font-weight: 500;
		text-decoration: none;
		transform: translateY(-200%);
		transition: transform 150ms var(--ease-out);
	}
	.skip-link:focus-visible {
		transform: none;
	}
</style>
