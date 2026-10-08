<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    content: string;
  }

  let { content }: Props = $props();

  let container = $state<HTMLDivElement | null>(null);
  let errorMsg = $state<string | null>(null);
  let loading = $state(true);

  let id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;

  onMount(() => {
    let cancelled = false;

    async function renderMermaid() {
      loading = true;
      errorMsg = null;
      try {
        const mermaid = (await import('mermaid')).default;
        if (cancelled) return;

        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: isDark ? 'dark' : 'default',
          layout: 'dagre',
          flowchart: {
            defaultRenderer: 'dagre',
          },
          state: {
            defaultRenderer: 'dagre',
          },
        });

        const { svg } = await mermaid.render(id, content.trim());
        if (cancelled) return;

        if (container) {
          container.innerHTML = svg;
          const svgEl = container.querySelector('svg');
          if (svgEl) {
            svgEl.style.maxWidth = '100%';
            svgEl.style.maxHeight = '380px';
            svgEl.style.height = 'auto';
            svgEl.style.width = 'auto';
            svgEl.style.display = 'block';
            svgEl.style.margin = '0 auto';
          }
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

    renderMermaid();

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
      <span>Failed to render Mermaid diagram: {errorMsg}</span>
    </div>
  {/if}
  <div bind:this={container} class="w-full flex items-center justify-center"></div>
</div>
