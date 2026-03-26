import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';

const ROUTES_DIR = 'src/routes';
const ASSETS_BASE_DIR = 'static/assets';

function syncAssetsFolders(): void {
	const files = globSync(`${ROUTES_DIR}/**/+page.svelte`);
	files.forEach((file: string) => {
		const normalizedPath = file.split(path.sep).join('/');
		const routeName = normalizedPath.replace(`${ROUTES_DIR}/`, '').replace('/+page.svelte', '');
		if (!routeName || routeName === '+page.svelte') return;

		const targetDirs = [
			path.join(ASSETS_BASE_DIR, routeName, 'images'),
			path.join(ASSETS_BASE_DIR, routeName, 'fonts')
		];
		targetDirs.forEach((dir) => {
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
				const gitKeep = path.join(dir, '.gitkeep');
				if (!fs.existsSync(gitKeep)) fs.writeFileSync(gitKeep, '');
			}
		});
	});
}

function deleteAssetsFolders(filepath: string): void {
	const normalizedPath = filepath.split(path.sep).join('/');

	if (!normalizedPath.includes(ROUTES_DIR)) return;

	const routeName = normalizedPath.split(`${ROUTES_DIR}/`)[1].replace('/+page.svelte', '');

	if (!routeName || routeName.trim() === '') return;

	const targetRouteDir = path.join(ASSETS_BASE_DIR, routeName);

	if (fs.existsSync(targetRouteDir)) {
		try {
			fs.rmSync(targetRouteDir, { recursive: true, force: true });
			console.log(`🗑️  [Auto] Route supprimée : Dossier assets nettoyé -> ${targetRouteDir}`);
		} catch (error) {
			console.error(`❌ Erreur lors de la suppression de ${targetRouteDir}:`, error);
		}
	}
}

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		ViteImageOptimizer({
			includePublic: true,
			include: /\.(jpe?g|png|gif|tiff|webp|svg)$/i,
			jpg: { quality: 80 },
			png: { quality: 80 },
			svg: {
				multipass: true,
				plugins: [
					{
						name: 'preset-default',
						params: {
							overrides: {
								cleanupNumericValues: false,
								removeViewBox: false
							}
						}
					}
				]
			}
		}),

		{
			name: 'watch-and-create-folders',
			buildStart() {
				syncAssetsFolders();
			},
			configureServer(server) {
				server.watcher.on('add', (filepath) => {
					if (filepath.includes('src/routes') && filepath.endsWith('+page.svelte')) {
						console.log('⚡ Nouvelle route détectée !');
						syncAssetsFolders();
					}
				});

				server.watcher.on('unlink', (filepath) => {
					if (filepath.includes('src/routes') && filepath.endsWith('+page.svelte')) {
						console.log('🗑️  Route supprimée détectée...');
						deleteAssetsFolders(filepath);
					}
				});
			}
		}
	]
});
