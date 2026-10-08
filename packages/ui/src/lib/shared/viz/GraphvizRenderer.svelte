<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    dot: string;
  }

  let { dot }: Props = $props();

  let container = $state<HTMLDivElement | null>(null);
  let errorMsg = $state<string | null>(null);
  let loading = $state(true);

  onMount(() => {
    let cancelled = false;

    async function renderGraphviz() {
      loading = true;
      errorMsg = null;
      try {
        const { instance } = await import('@viz-js/viz');
        const viz = await instance();
        if (cancelled) return;

        // Render DOT to SVG element
        const svgElement = viz.renderSVGElement(dot);

        // Make SVG responsive and theme-friendly without vertical blowout
        svgElement.removeAttribute('width');
        svgElement.removeAttribute('height');
        svgElement.style.maxWidth = '100%';
        svgElement.style.maxHeight = '360px';
        svgElement.style.width = 'auto';
        svgElement.style.height = 'auto';
        svgElement.style.display = 'block';
        svgElement.style.margin = '0 auto';

        if (container && !cancelled) {
          container.replaceChildren(svgElement);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          errorMsg = err instanceof Error ? err.message : String(err);
        }
      } finally {
        if (!cancelled) {
          loading = false;
        }
      }
    }

    renderGraphviz();

    return () => {
      cancelled = true;
    };
  });
</script>

<div class="w-full flex flex-col items-center justify-center p-2">
  {#if loading}
    <div class="flex items-center gap-2 text-sm text-base-content/60 py-8">
      <span class="loading loading-spinner loading-sm"></span>
      <span>Rendering diagram...</span>
    </div>
  {:else if errorMsg}
    <div class="alert alert-error text-xs max-w-lg my-2">
      <span>Failed to render Graphviz diagram: {errorMsg}</span>
    </div>
  {/if}
  <div bind:this={container} class="w-full flex items-center justify-center"></div>
</div>
