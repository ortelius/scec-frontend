import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess({ strict: false }), // Fix for strict TypeScript issues

  kit: {
    alias: {
      $components: 'src/components', // Fix for `baseUrl` and `paths` from tsconfig.json
      $routes: 'src/routes',
      $lib: 'src/lib'
    },
    paths: {
      base: ''
    },
    adapter: adapter({
      out: 'build',
      precompress: true
    })
  }
};

export default config;
