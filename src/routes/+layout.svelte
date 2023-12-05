<script lang="ts">
  import TopAppBar, { Row, Section, Title, AutoAdjust } from '@smui/top-app-bar';
  import { mdiMenu, mdiWeatherSunny, mdiWeatherNight } from '@mdi/js';
  import IconButton, { Icon } from '@smui/icon-button';
  import { browser } from '$app/environment';
  import { writable } from 'svelte/store'
  const theme = writable("light");

  let topAppBar: TopAppBar;

  function isDarkMode() {
    return (browser && document.documentElement.classList.contains("dark")) ? true : false;
  }

  // Toggles the "dark" class
  function toggleDarkMode() {
    let newstate = "dark";

    if (isDarkMode())
     newstate = "light";

    theme.set(newstate);

    if (browser)
    {
      localStorage.setItem("theme",newstate);
      (newstate == "dark") ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
    }
  }
</script>

<svelte:head>
  <meta name="color-scheme" content="light dark" />
  <link rel="stylesheet" type="text/css" href="/swagger-ui-dist/swagger-ui.css">
  <link rel="stylesheet" type="text/css" href="/smui-light.css" />
  <link rel="stylesheet" type="text/css" href="/smui-dark.css" />
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
      <IconButton role="button" on:click={() => { toggleDarkMode() }} >
        <Icon tag="svg" viewBox="0 0 24 24" class="weather-night">
          <path fill="currentColor" d={mdiWeatherNight} />
        </Icon>
        <Icon tag="svg" viewBox="0 0 24 24" class="weather-sunny">
          <path fill="currentColor" d={mdiWeatherSunny} />
        </Icon>
      </IconButton>
    </Section>
  </Row>
</TopAppBar>
<AutoAdjust {topAppBar}>
  <slot />
</AutoAdjust>
