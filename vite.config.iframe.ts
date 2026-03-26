import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		lib: {
			entry: './src/iframe.ts',
			name: 'Prehome',
			fileName: 'main',
			formats: ['iife']
		},
		outDir: 'static/prehome',
		emptyOutDir: true,
		rollupOptions: {
			output: {
				entryFileNames: 'main.js'
			}
		}
	}
});
