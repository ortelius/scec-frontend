
<script>
	import {onMount} from 'svelte';

	const apiURL = "http://localhost:8080/msapi/compver/bafkreifw6fbrhbmcscd2bw2bz2gcmb4ge5fjh7rsvf3slygd3fugfym67y";
	let compname = "";

 	onMount(async ()  => {
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
