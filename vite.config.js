import { defineConfig } from 'vite'

// Minimal config; rely on esbuild for JSX. Proxy /api to Spring Boot during dev.
export default defineConfig({
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:8080',
				changeOrigin: true,
			},
		},
	},
})
