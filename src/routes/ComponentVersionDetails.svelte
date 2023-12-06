
<script>
	import {onMount} from 'svelte';

	let compname = "";

 	onMount(async ()  => {
		let apiURL = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '') + "/msapi/compver/bafkreie2tvmlendutm5gss7vrgr7jrd65mkuiqtfnugrdeujszuyaerrha";

		await fetch(apiURL).then(r => r.json()).then(data => {compname = data.domain.name + '.' + data.name;});
  	});
</script>

<style>
	article {
		margin: 0 0 1em 0;
	}

	h1 {
		font-size: 1.4em;
		margin: 0;
		display: block;
	}
</style>


<article>
		<h1>{compname}</h1>
</article>
