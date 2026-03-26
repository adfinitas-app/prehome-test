<script lang="ts">
	import { page } from '$app/state';
	import Prehome from '$lib/components/Prehome.svelte';

	const routeName = page.url.pathname.split('/').filter(Boolean).join('-');
</script>

<Prehome class="h-[80vh] w-[80vw] rounded-xl bg-indigo-400 p-10 text-white" {routeName}>
	<div class="m-auto text-center">
		<h1 class="mb-2 animate-pulse text-2xl">
			Route active : {routeName}
		</h1>

		<p class="text-gray-200">
			Permet de surcharger les classes de la préhome sans toucher au composant principal
		</p>
	</div>
</Prehome>
