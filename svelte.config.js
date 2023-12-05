// svelte.config.js
import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/kit/vite'

const config = {
  preprocess: vitePreprocess(),

  kit: {
    paths: {
      base: ''
    },
    adapter: adapter()
    // Other SvelteKit configurations...
  }
}

export default config
