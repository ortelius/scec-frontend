import { sveltekit } from '@sveltejs/kit/vite'

/** @type {import('vite').UserConfig} */
const config = {
  base: '/', // Ensure that the base path matches the Nginx configuration
  plugins: [sveltekit()]
}

export default config
