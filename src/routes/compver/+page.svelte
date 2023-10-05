<script lang="ts">
  import { onMount } from "svelte";
  import Card, { Content } from "@smui/card";
  import { CompVerDetail } from "$lib/types";
  import LayoutGrid, { Cell } from "@smui/layout-grid";
  import Textfield from "@smui/textfield";
  import { mdiOpenInNew } from "@mdi/js";
  import IconButton, { Icon } from "@smui/icon-button";
  import { marked } from "marked";
  import { Svroller } from "svrollbar";
  import DataTable, { Head, Body, Row, Cell as DtCell } from "@smui/data-table";
  import SwaggerUIBundle from "swagger-ui-dist/swagger-ui-bundle";

  function mapTextFields(detail: any) {
    let gitrepo = {
      title: "Git Repo Details",
      fields: [
        { label: "Url", value: compverdetail.attrs.giturl },
        { label: "Org", value: compverdetail.attrs.gitorg },
        { label: "Project", value: compverdetail.attrs.gitrepoproject },
        { label: "Tag", value: compverdetail.attrs.gittag },
        { label: "Branch", value: compverdetail.attrs.gitbranch },
        { label: "Branch Create Commit", value: compverdetail.attrs.gitbranchcreatecommit },
        { label: "Branch Create Date", value: compverdetail.attrs.gitbranchcreatetimestamp },
        { label: "Branch Parent", value: compverdetail.attrs.gitbranchparent },
      ],
    };

    let gitcommit = {
      title: "Git Commit Details",
      fields: [
        { label: "Commit", value: compverdetail.attrs.gitcommit },
        { label: "Commit Verfied", value: compverdetail.attrs.gitverifycommit },
        { label: "Signed-off By", value: compverdetail.attrs.gitsignedoffby.replace(/&lt;/g, "<").replace(/&gt;/g, ">") },
        { label: "Commit Date", value: compverdetail.attrs.gitcommittimestamp },
        { label: "Lines Added", value: compverdetail.attrs.gitlinesadded },
        { label: "Lines Deleted", value: compverdetail.attrs.gitlinesdeleted },
        { label: "Lines Total", value: compverdetail.attrs.gitlinestotal },
        { label: "Previous Commit", value: compverdetail.attrs.gitprevcompcommit },
      ],
    };

    let gitactivity = {
      title: "Git Activity",
      fields: [
        { label: "Total Committers", value: compverdetail.attrs.gittotalcommitterscnt },
        { label: "Active Committers", value: compverdetail.attrs.gitcommitterscnt },
        { label: "Contributors %", value: compverdetail.attrs.gitcontribpercentage },
        { label: "Authors", value: compverdetail.attrs.gitcommitauthors },
      ],
    };

    let compinfo = {
      title: "Catalog Details",
      fields: [
        { label: "Service Owner", value: compverdetail.attrs.serviceowner.name },
        { label: "Service Owner Phone", value: compverdetail.attrs.serviceowner.phone },
        { label: "Service Owner Email", value: compverdetail.attrs.serviceowner.email },
        { label: "Build Date", value: compverdetail.attrs.builddate },
        { label: "Build Number", value: compverdetail.attrs.buildnum },
        { label: "Discord", value: compverdetail.attrs.discordchannel },
        { label: "Slack", value: compverdetail.attrs.slackchannel },
        { label: "Hipchat", value: compverdetail.attrs.hipchatchannel },
      ],
    };
    return [compinfo, gitrepo, gitcommit, gitactivity];
  }

  let compverdetail = CompVerDetail;
  let readme = "";
  let swagger = "";
  let license = "";
  let vulns: any[] = [];
  let cells = mapTextFields(compverdetail);
  let compinfo = cells[0];
  cells = cells.slice(1);
  let swaggerUI;

  const apiURL = "http://localhost:8080/msapi/compver/bafkreifw6fbrhbmcscd2bw2bz2gcmb4ge5fjh7rsvf3slygd3fugfym67y";

  onMount(async () => {
    await fetch(apiURL)
      .then((r) => r.json())
      .then((data) => {
        compverdetail = data;
        cells = mapTextFields(compverdetail);
        compinfo = cells[0];
        cells = cells.slice(1);
        readme = (<string[]>compverdetail.readme.content).join("\n");
        license = (<string[]>compverdetail.license.content).join("\n");
        swagger = JSON.stringify(compverdetail.swagger.content);

        swaggerUI = SwaggerUIBundle({
          dom_id: "#swagger-ui",
          spec: JSON.parse(swagger), // Parse the JSON string
          presets: [SwaggerUIBundle.presets.apis],
          layout: "BaseLayout",
        });
      });
  });

  function isLink(value: any) {
    if (typeof value !== "string") return false;

    if (value.includes("http:") || value.includes("https:") || value.includes("git@")) return true;

    return false;
  }

  function getLink(url: string) {
    if (url.includes("git@github.com")) return url.replace("git@", "https://").replace(".com:", ".com/");

    return url;
  }
</script>

<Content>
  <h2>{compverdetail.domain.name}.{compverdetail.name}</h2>
</Content>
<LayoutGrid>
  <Cell>
    <Card padded>
      <div class="cell_title">{compinfo.title}</div>
      {#each compinfo.fields as fld}
        {#if isLink(fld.value)}
          <Textfield bind:value={fld.value} label={fld.label}>
            <IconButton slot="trailingIcon" on:click={() => window.open(getLink(fld.value), "_blank")}>
              <Icon tag="svg" viewBox="0 0 24 24">
                <path fill="currentColor" d={mdiOpenInNew} />
              </Icon>
            </IconButton>
          </Textfield>
        {:else}
          <Textfield bind:value={fld.value} label={fld.label} />
        {/if}
      {/each}
    </Card>
  </Cell>
  <Cell span={8}>
    <Card padded>
      <div class="cell_title">Licenses & Vulnerabilities</div>
      <DataTable stickyHeader table$aria-label="Vulnerabilities" style="max-width: 100%;height: 28em;">
        <Head>
          <Row>
            <DtCell>Package</DtCell>
            <DtCell>Version</DtCell>
            <DtCell>License</DtCell>
            <DtCell>Id</DtCell>
            <DtCell>Summary</DtCell>
          </Row>
        </Head>
        <Body>
          {#each vulns as fld}
            <Row>
              <DtCell>{fld.package}</DtCell>
              <DtCell>{fld.version}</DtCell>
              <DtCell>{fld.license}</DtCell>
              <DtCell>{fld.id}</DtCell>
              <DtCell>{fld.summary}</DtCell>
            </Row>
          {/each}
        </Body>
      </DataTable>
    </Card>
  </Cell>
</LayoutGrid>
<LayoutGrid>
  {#each cells as cell_detail}
    <Cell>
      <Card padded>
        <div class="cell_title">{cell_detail.title}</div>
        {#each cell_detail.fields as fld}
          {#if isLink(fld.value)}
            <Textfield bind:value={fld.value} label={fld.label}>
              <IconButton slot="trailingIcon" on:click={() => window.open(getLink(fld.value), "_blank")}>
                <Icon tag="svg" viewBox="0 0 24 24">
                  <path fill="currentColor" d={mdiOpenInNew} />
                </Icon>
              </IconButton>
            </Textfield>
          {:else}
            <Textfield bind:value={fld.value} label={fld.label} />
          {/if}
        {/each}
      </Card>
    </Cell>
  {/each}
  <Cell>
    <Card padded>
      <div class="cell_title">ReadMe</div>
      <Svroller width="100%" height="28em" alwaysVisible={true}>
        <div class="markdown">
          {@html marked(readme)}
        </div>
      </Svroller>
    </Card>
  </Cell>
  <Cell>
    <Card padded>
      <div class="cell_title">OpenApi</div>
      <Svroller width="100%" height="28em" alwaysVisible={true}>
        <div id="swagger-ui" />
      </Svroller>
    </Card>
  </Cell>
  <Cell>
    <Card padded>
      <div class="cell_title">License</div>
      <Svroller width="100%" height="28em" alwaysVisible={true}>
        <div class="markdown">
          {@html marked(license)}
        </div>
      </Svroller>
    </Card>
  </Cell>
</LayoutGrid>
