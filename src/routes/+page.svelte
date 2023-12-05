<script lang="ts">
  import Button from "@smui/button";
  import ComponentVersionDetails from "./ComponentVersionDetails.svelte";
  import Textfield from "@smui/textfield";
  import Card, { Content } from "@smui/card";
  import LayoutGrid, { Cell } from "@smui/layout-grid";
  import Icon from "@smui/textfield/icon";
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

<Button role="button"  on:click={() => alert("Here")}>Hit Me</Button>

<main>
  <ComponentVersionDetails />

  <Cell>
    <Card padded>
      <Textfield variant="filled" value="xxxxx" label="WWWWWW">
        <Icon class="material-icons" slot="trailingIcon">delete</Icon>
      </Textfield>
    </Card>
  </Cell>
</main>
