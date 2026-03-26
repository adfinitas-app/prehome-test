<script lang="ts">
	import Icon from '@iconify/svelte';
	import { type Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		closeButton?: Snippet<[() => void]>;
		routeName?: string;
		class?: string;
	}

	let { children, closeButton, routeName = 'default', class: className = '' }: Props = $props();

	function close() {
		window.parent.postMessage({ type: `close-iframe-prehome-${routeName}` }, '*');
	}
</script>

<div
	class="fixed top-1/2 left-1/2 z-[9999] -translate-x-1/2 -translate-y-1/2 transform text-center {className}"
>
	<div class="relative flex h-full flex-col">
		{#if closeButton}
			{@render closeButton(close)}
		{:else}
			<button
				data-umami-event="close-button"
				class="absolute top-4 right-4 cursor-pointer"
				onclick={close}
			>
				<Icon
					class="text-stone-700 transition duration-300 ease-in-out hover:scale-110 hover:text-stone-950"
					icon="material-symbols:close-rounded"
					width="24"
					height="24"
				/>
			</button>
		{/if}

		{@render children()}
	</div>
</div>

<style>
	* {
		overflow: auto;
	}
</style>
