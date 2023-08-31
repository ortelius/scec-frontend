<script lang="ts">
  import Button from "@smui/button";
  import ComponentVersionDetails from "./ComponentVersionDetails.svelte";
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

<Button on:click={() => alert('Here')}>Hit Me</Button>

<main>
  <ComponentVersionDetails />
</main>
