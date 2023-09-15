<script lang="ts">
  import { onMount } from "svelte";
  import Card, { Content } from "@smui/card";
  import { CompVerDetail } from "$lib/types";
  import LayoutGrid, { Cell } from "@smui/layout-grid";
  import Textfield from "@smui/textfield";

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
        { label: "Lines Delete", value: compverdetail.attrs.gitlinesdeleted },
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
    return [gitrepo, gitcommit, gitactivity];
  }

  let compverdetail = CompVerDetail;
  let cells = mapTextFields(compverdetail);

  const apiURL = "http://localhost:8080/msapi/compver/bafkreifw6fbrhbmcscd2bw2bz2gcmb4ge5fjh7rsvf3slygd3fugfym67y";

  onMount(async () => {
    await fetch(apiURL)
      .then((r) => r.json())
      .then((data) => {
        compverdetail = data;
        cells = mapTextFields(compverdetail);
      });
  });
</script>

<LayoutGrid>
  {#each cells as cell_detail}
    <Cell>
      <Card padded>
        <div class="cell_title">{cell_detail.title}</div>
        {#each cell_detail.fields as fld}
          <Textfield variant="filled" bind:value={fld.value} label={fld.label} />
		  <pre class="status">Value: {fld.value}</pre>
        {/each}
      </Card>
    </Cell>
  {/each}
</LayoutGrid>
