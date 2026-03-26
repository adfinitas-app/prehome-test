<script lang="ts">
	import { page } from '$app/state';
	import Prehome from '$lib/components/Prehome.svelte';
	import Icon from '@iconify/svelte';

	const routeName = page.url.pathname.split('/').filter(Boolean).join('-');
</script>

<Prehome class="h-full w-full bg-amber-500" {routeName}>
	{#snippet closeButton(closeAction)}
		<button
			onclick={closeAction}
			class="absolute top-4 right-4 cursor-pointer rounded-full bg-white px-4 py-2 font-bold text-orange-600 shadow transition hover:bg-orange-100"
		>
			Fermer X
		</button>
	{/snippet}

	<div class="m-auto text-center">
		<Icon
			class="m-auto mb-4 text-orange-600"
			icon="line-md:bell-alert-filled"
			width="100"
			height="100"
		/>

		<h1 class="mb-2 animate-pulse text-2xl">
			Route active : {routeName}
		</h1>

		<p class="text-gray-700">Permet de changer le bouton de fermeture</p>
	</div>
</Prehome>
