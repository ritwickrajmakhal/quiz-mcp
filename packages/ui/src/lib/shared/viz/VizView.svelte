<script lang="ts">
  import type { VizAttachment } from '@quiz-mcp/core';
  import MermaidRenderer from './MermaidRenderer.svelte';
  import GraphvizRenderer from './GraphvizRenderer.svelte';
  import SvgRenderer from './SvgRenderer.svelte';
  import CanvasSandbox from './CanvasSandbox.svelte';

  interface Props {
    attachment: VizAttachment;
  }

  let { attachment }: Props = $props();
</script>

<figure class="my-4 flex flex-col items-center justify-center overflow-hidden rounded-box border border-base-300 bg-base-200/40 p-4">
  <div
    class="w-full flex items-center justify-center"
    style="{attachment.height ? `max-height: ${attachment.height}px;` : ''} min-height: 100px;"
  >
    {#if attachment.engine === 'mermaid'}
      <MermaidRenderer content={attachment.content} />
    {:else if attachment.engine === 'graphviz'}
      <GraphvizRenderer dot={attachment.content} />
    {:else if attachment.engine === 'svg'}
      <SvgRenderer svg={attachment.content} />
    {:else if attachment.engine === 'html_canvas'}
      <CanvasSandbox
        code={attachment.content}
        height={attachment.height}
        aspectRatio={attachment.aspectRatio}
      />
    {/if}
  </div>
  {#if attachment.title}
    <figcaption class="mt-2 text-center text-xs font-medium text-base-content/70">
      {attachment.title}
    </figcaption>
  {/if}
</figure>
