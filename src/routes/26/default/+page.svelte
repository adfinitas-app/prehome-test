<script lang="ts">
	import { page } from '$app/state';
	import Prehome from '$lib/components/Prehome.svelte';
	import Icon from '@iconify/svelte';

	const routeName = page.url.pathname.split('/').filter(Boolean).join('-');
	const queryParams = page.url.searchParams;
	const maxViews = queryParams.get('maxViews');
	const clientId = queryParams.get('configClientId');
	const customTitle = queryParams.get('title');
</script>

<Prehome class="h-full w-full bg-indigo-300  text-white" {routeName}>
	<div class="m-auto text-center">
		<Icon
			class="m-auto mb-4 text-indigo-900"
			icon="line-md:bell-alert-filled"
			width="100"
			height="100"
		/>

		<h1 class="mb-2 animate-pulse text-2xl">
			Test 2026 Route active : {routeName}
		</h1>

		<p class="text-gray-700">
			Infos du script : Client {clientId} (Max vues: {maxViews})
		</p>

		{#if customTitle}
			<h2 class="mt-4 text-xl font-bold">{customTitle}</h2>
		{/if}
	</div>
</Prehome>
