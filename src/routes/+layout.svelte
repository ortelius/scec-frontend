<script lang="ts">
  import TopAppBar, { Row, Section, Title, AutoAdjust } from '@smui/top-app-bar';
  import { mdiMenu, mdiWeatherSunny, mdiWeatherNight } from '@mdi/js';
  import IconButton, { Icon } from '@smui/icon-button';
  import {onMount} from 'svelte';

  let topAppBar: TopAppBar;
  let darkMode: boolean | undefined = undefined;

  onMount(() => {
    darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
</script>

<svelte:head>
	<!-- SMUI Styles -->
  {#if darkMode === undefined }
	<link rel="stylesheet" href="/smui.css" media="(prefers-color-scheme: light)" />
  <link rel="stylesheet" href="/smui-dark.css" media="screen and (prefers-color-scheme: dark)" />
  {:else if darkMode}
	<link rel="stylesheet" href="/smui.css"/>
  <link rel="stylesheet" href="/smui-dark.css" media="screen" />
  {:else}
  <link rel="stylesheet" href="/smui.css"/>
  {/if}
  <link rel="stylesheet" href="/ortelius.css"/>
</svelte:head>

<TopAppBar bind:this={topAppBar} variant="standard">
  <Row>
    <Section>
      <IconButton>
        <Icon tag="svg" viewBox="0 0 24 24">
          <path fill="currentColor" d={mdiMenu} />
        </Icon>
      </IconButton>
      <Title>Standard</Title>
    </Section>
    <Section align="end" toolbar>
      <IconButton on:click={() => (darkMode = !darkMode)}>
        <Icon tag="svg" viewBox="0 0 24 24">
          <path fill="currentColor" d={ (darkMode === undefined || darkMode) ? mdiWeatherNight : mdiWeatherSunny } />
        </Icon>
      </IconButton>
    </Section>
  </Row>
</TopAppBar>
<AutoAdjust {topAppBar}>
  <slot />
</AutoAdjust>
