<script lang="ts">
	import config from '$lib/.prehome-config.json';
	import { onMount } from 'svelte';

	// --- 1. SCAN AUTOMATIQUE DES ROUTES ---
	const modules = import.meta.glob('/src/routes/**/+page.svelte');

	const availableRoutes = Object.keys(modules)
		.map((path) => {
			return path.replace('/src/routes/', '').replace('/+page.svelte', '');
		})
		.filter((route) => route !== '');
	let hostOrigin = $state('http://localhost:4173');
	let hostDomain = $state('localhost:4173');

	let selectedRoute = $state(availableRoutes.length > 0 ? availableRoutes[0] : 'default');
	let platform = $state('gtm');
	let capping = $state(1);
	let maxViews = $state(1);

	function injectScript() {
		const script = document.createElement('script');
		script.src = `${hostOrigin}/prehome/main.js`;
		script.dataset.host = hostDomain;
		script.dataset.route = selectedRoute;
		script.dataset.platform = 'standard';
		script.dataset.capping = capping.toString();
		script.dataset.maxViews = (maxViews * 10000000).toString();
		document.body.appendChild(script);
	}

	onMount(() => {
		hostOrigin = window.location.origin;
		hostDomain = window.location.host;
	});

	const inputClass =
		'w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800';
	let generatedScript = $derived.by(() => {
		const scriptUrl = `${hostOrigin}/prehome/main.js`;

		if (platform === 'beyable') {
			return `
(function(SId, CId) {
    function load_script(url, callback) {
        var s = document.createElement('script');
        s.src = url;
        s.dataset.host = '${hostDomain}';
        s.dataset.route = '${selectedRoute}';
        s.dataset.platform = 'beyable';

        s.onload = callback;
        s.onreadystatechange = function() {
            if (this.readyState == 'complete' || this.readyState == 'loaded') callback();
        };
        document.head.appendChild(s);
    }

    load_script('${scriptUrl}', function(){
        console.log("Prehome Beyable loaded");
    });
}(SId, CId));
`.trim();
		} else if (platform === 'script') {
			return `
var s = document.createElement('script');
s.src = '${scriptUrl}';
s.dataset.host = '${hostDomain}';
s.dataset.route = '${selectedRoute}';
s.dataset.platform = 'gtm';
s.dataset.capping = '${capping}';
s.dataset.maxViews = '${maxViews}';
document.body.appendChild(s);
`.trim();
		} else {
			const closeScript = '<' + '/script>';

			return `
<script>
var s = document.createElement('script');
s.src = '${scriptUrl}';
s.dataset.host = '${hostDomain}';
s.dataset.route = '${selectedRoute}';
s.dataset.platform = 'gtm';
s.dataset.capping = '${capping}';
s.dataset.maxViews = '${maxViews}';
document.body.appendChild(s);
${closeScript}
`.trim();
		}
	});

	let copyStatus = $state('Copier le script');

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(generatedScript);
			copyStatus = 'Copié !';
			setTimeout(() => (copyStatus = 'Copier le script'), 2000);
		} catch (err) {
			console.error('Erreur de copie', err);
		}
	}
</script>

<div class="m-auto max-w-5xl p-6 font-sans">
	<h1 class="mb-6 text-3xl font-bold text-gray-800">
		Générateur Préhomes : <span class="text-orange-600 capitalize">{config.clientId}</span>
	</h1>

	<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
		<div class="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm">
			<h2 class="mb-4 text-xl font-semibold text-gray-800">1. Configuration</h2>

			<div class="flex flex-col">
				<label for="route" class="mb-1 text-sm font-bold text-gray-700">Route (Campagne)</label>
				<select id="route" bind:value={selectedRoute} class={inputClass}>
					{#each availableRoutes as route, index (index)}
						<option value={route}>{route}</option>
					{/each}
				</select>
			</div>

			<div class="flex flex-col">
				<label for="platform" class="mb-1 text-sm font-bold text-gray-700">Plateforme cible</label>
				<select id="platform" bind:value={platform} class={inputClass}>
					<option value="gtm">GTM (Balise Script HTML)</option>
					<option value="beyable">Beyable (Code JS Custom)</option>
					<option value="script">Script Classique (Console / JS)</option>
				</select>
			</div>

			<!-- Modification : On cache ces champs si c'est Beyable. Pour 'script', on les affiche car le code généré utilise le capping -->
			{#if platform !== 'beyable'}
				<div class="grid grid-cols-2 gap-4">
					<div class="flex flex-col">
						<label for="capping" class="mb-1 text-sm font-bold text-gray-700">Capping (jours)</label
						>
						<input id="capping" type="number" min="1" bind:value={capping} class={inputClass} />
					</div>
					<div class="flex flex-col">
						<label for="maxViews" class="mb-1 text-sm font-bold text-gray-700">Vues Max</label>
						<input id="maxViews" type="number" min="1" bind:value={maxViews} class={inputClass} />
					</div>
				</div>
			{/if}
		</div>

		<div class="flex h-full flex-col">
			<h2 class="mb-4 text-xl font-semibold text-gray-800">2. Code à intégrer</h2>

			<div
				class="relative flex flex-1 flex-col overflow-hidden rounded-lg bg-gray-900 p-4 font-mono text-xs text-gray-100 shadow-lg md:text-sm"
			>
				<div
					class="absolute top-2 right-2 rounded bg-gray-700 px-2 py-1 text-xs tracking-wider text-gray-300 uppercase"
				>
					{platform === 'gtm' ? 'HTML' : 'JAVASCRIPT'}
				</div>

				<pre
					class="max-h-[400px] flex-1 overflow-y-auto break-all whitespace-pre-wrap text-green-400">{generatedScript}</pre>

				<div class="mt-4 flex items-center justify-between border-t border-gray-700 pt-4">
					<span class="text-xs text-gray-400">Host: {hostDomain}</span>
					<button
						onclick={copyToClipboard}
						class="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition-colors hover:bg-blue-700"
					>
						{copyStatus}
					</button>
				</div>
			</div>
		</div>
	</div>
	<div class="text mx-auto mt-12">
		<button
			class="flex cursor-pointer items-center gap-2 rounded bg-sky-600 px-6 py-2 text-xl font-bold text-white shadow transition-all hover:scale-105 hover:bg-sky-700"
			onclick={injectScript}>Injecter le script {selectedRoute}</button
		>
	</div>
	<div class="mt-12 border border-gray-100 bg-gray-50 p-4">
		<h3 class="mb-3 text-lg font-bold text-gray-700">
			<p class="text-2xl">
				👀 Aperçu en direct: <span class="font-normal text-gray-500">/{selectedRoute}</span>
			</p>
			<p>Les variables dataset ne sont pas chargés ici, le close ne ferme pas non plus.</p>
			<p class="font-extrabold">Utiliser inject script pour avoir toutes les fonctionnalités</p>
		</h3>
		<iframe class="mt-4 h-[40em] w-full border-4 border-indigo-600" src="/{selectedRoute}"></iframe>
	</div>
</div>
