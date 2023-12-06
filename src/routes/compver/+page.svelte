<script lang="ts">
  import { onMount } from "svelte";
  import Card, { Content } from "@smui/card";
  import { CompVerDetail } from "$lib/types";
  import LayoutGrid, { Cell as LayoutCell } from "@smui/layout-grid";
  import Textfield from "@smui/textfield";
  import { mdiOpenInNew } from "@mdi/js";
  import IconButton, { Icon } from "@smui/icon-button";
  import Select, { Option } from "@smui/select";
  import { Label } from "@smui/common";
  import { marked } from "marked";
  import { Svroller } from "svrollbar";
  import DataTable, { Head, Body, Row, Cell, Pagination } from "@smui/data-table";
  import SwaggerUIBundle from "swagger-ui-dist/swagger-ui-bundle";
  import { merge } from "lodash";

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
  let pkgs: any[] = [];
  let rowsPerPage = 6;
  let currentPage = 0;

  $: start = currentPage * rowsPerPage;
  $: end = Math.min(start + rowsPerPage, pkgs.length);
  $: lastPage = Math.max(Math.ceil(pkgs.length / rowsPerPage) - 1, 0);

  $: if (currentPage > lastPage) {
    currentPage = lastPage;
  }

  let cells = mapTextFields(compverdetail);
  let compinfo = cells[0];
  cells = cells.slice(1);
  let swaggerUI;

  let restapiURL = "http://localhost:8080";

  if (!window.location.origin) {
    restapiURL = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
  }

  //  const apiURL = "http://localhost:8080/msapi/compver/bafkreif4ejff67pjs47qgvrnffymj24g7gkcb2hqf6geevttygqqpicbdu";
  // const apiURL = "http://localhost:8080/msapi/compver/bafkreie2tvmlendutm5gss7vrgr7jrd65mkuiqtfnugrdeujszuyaerrha";
	let apiURL = restapiURL + "/msapi/compver/bafkreihgh5zqsptqaaxarpx7j6ucsktxr7337hffin76r5basyzrzk3ydm";

  onMount(async () => {
    await fetch(apiURL)
      .then((r) => r.json())
      .then((data) => {
        compverdetail = merge(compverdetail, data);
        cells = mapTextFields(compverdetail);
        compinfo = cells[0];
        cells = cells.slice(1);
        readme = (<string[]>compverdetail.readme.content).join("\n");
        license = (<string[]>compverdetail.license.content).join("\n");
        swagger = JSON.stringify(compverdetail.swagger.content);
        pkgs = compverdetail.packages;

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
  <LayoutCell>
    <Card padded>
      <div class="cell_title">{compinfo.title}</div>
      {#each compinfo.fields as fld}
        {#if isLink(fld.value)}
          <Textfield bind:value={fld.value} label={fld.label}>
            <IconButton role="button" slot="trailingIcon" action="open-link" on:click={() => window.open(getLink(fld.value), "_blank")}>
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
  </LayoutCell>
  <LayoutCell span={8}>
    <Card padded>
      <div class="cell_title">Licenses & Vulnerabilities</div>
      <DataTable style="width: 100%;height: 28em">
        <Head>
          <Row>
            <Cell />
            <Cell>Package</Cell>
            <Cell>Version</Cell>
            <Cell>Language</Cell>
            <Cell>License</Cell>
            <Cell>CVE</Cell>
            <Cell>Summary</Cell>
          </Row>
        </Head>
        <Body>
          {#each pkgs.slice(start, end) as fld}
            <Row>
              <Cell class="severity-{fld.severity.toLowerCase()}" />
              <Cell class="cell-text-top">{fld.name}</Cell>
              <Cell class="cell-text-top">{fld.version}</Cell>
              <Cell class="cell-text-top">{fld.license}</Cell>
              <Cell class="cell-text-top">{fld.language}</Cell>
              <Cell>
                {#if fld.cve.includes(",")}
                  {#each fld.cve.split(",") as cve}
                    {cve}
                    <IconButton role="button" class="open-small" action="open-link" on:click={() => window.open(getLink(`https://osv.dev/vulnerability/${cve}`), "_blank")}>
                      <Icon tag="svg" viewBox="0 0 24 24">
                        <path fill="currentColor" d={mdiOpenInNew} />
                      </Icon>
                    </IconButton>
                    <br />
                  {/each}
                {:else}
                  {fld.cve}
                  {#if fld.cve.length > 0}
                    <IconButton role="button" class="open-small" action="open-link" on:click={() => window.open(getLink(`https://osv.dev/vulnerability/${fld.cve}`), "_blank")}>
                      <Icon tag="svg" viewBox="0 0 24 24">
                        <path fill="currentColor" d={mdiOpenInNew} />
                      </Icon>
                    </IconButton>
                  {/if}
                {/if}
              </Cell>
              <Cell class="cell-text-top">
                {#if fld.summary.includes("|")}
                  {#each fld.summary.split("|") as summary}
                    {summary}
                    <br />
                  {/each}
                {:else}
                  {fld.summary}
                {/if}
              </Cell>
            </Row>
          {/each}
        </Body>
        <Pagination slot="paginate">
          <svelte:fragment slot="rowsPerPage">
            <Label>Rows Per Page</Label>
            <Select variant="outlined" bind:value={rowsPerPage} noLabel>
              <Option value={6}>6</Option>
              <Option value={20}>20</Option>
              <Option value={100}>100</Option>
            </Select>
          </svelte:fragment>
          <svelte:fragment slot="total">
            {start + 1}-{end} of {pkgs.length}
          </svelte:fragment>

          <IconButton role="button" class="material-icons" action="first-page" title="First page" on:click={() => (currentPage = 0)} disabled={currentPage === 0}>first_page</IconButton>
          <IconButton role="button" class="material-icons" action="prev-page" title="Prev page" on:click={() => currentPage--} disabled={currentPage === 0}>chevron_left</IconButton>
          <IconButton role="button" class="material-icons" action="next-page" title="Next page" on:click={() => currentPage++} disabled={currentPage === lastPage}>chevron_right</IconButton>
          <IconButton role="button" class="material-icons" action="last-page" title="Last page" on:click={() => (currentPage = lastPage)} disabled={currentPage === lastPage}>last_page</IconButton>
        </Pagination>
      </DataTable>
    </Card>
  </LayoutCell>
</LayoutGrid>
<LayoutGrid>
  {#each cells as cell_detail}
    <LayoutCell>
      <Card padded>
        <div class="cell_title">{cell_detail.title}</div>
        {#each cell_detail.fields as fld}
          {#if isLink(fld.value)}
            <Textfield bind:value={fld.value} label={fld.label}>
              <IconButton role="button" slot="trailingIcon" action="open-link" on:click={() => window.open(getLink(fld.value), "_blank")}>
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
    </LayoutCell>
  {/each}
  <LayoutCell>
    <Card padded>
      <div class="cell_title">ReadMe</div>
      <Svroller width="100%" height="28em" alwaysVisible={true}>
        <div class="markdown">
          {@html marked(readme)}
        </div>
      </Svroller>
    </Card>
  </LayoutCell>
  <LayoutCell>
    <Card padded>
      <div class="cell_title">OpenApi</div>
      <Svroller width="100%" height="28em" alwaysVisible={true}>
        <div id="swagger-ui" />
      </Svroller>
    </Card>
  </LayoutCell>
  <LayoutCell>
    <Card padded>
      <div class="cell_title">License</div>
      <Svroller width="100%" height="28em" alwaysVisible={true}>
        <div class="markdown">
          {@html marked(license)}
        </div>
      </Svroller>
    </Card>
  </LayoutCell>
</LayoutGrid>
