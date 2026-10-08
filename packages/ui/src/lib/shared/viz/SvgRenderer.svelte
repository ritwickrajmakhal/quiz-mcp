<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    svg: string;
  }

  let { svg }: Props = $props();

  let sanitized = $state<string>('');
  let container = $state<HTMLDivElement | null>(null);

  onMount(async () => {
    const DOMPurify = (await import('dompurify')).default;
    sanitized = DOMPurify.sanitize(svg.trim(), {
      USE_PROFILES: { svg: true, svgFilters: true },
    });
    if (container) {
      container.innerHTML = sanitized;
      const svgEl = container.querySelector('svg');
      if (svgEl) {
        svgEl.style.maxWidth = '100%';
        svgEl.style.height = 'auto';
        svgEl.style.display = 'block';
        svgEl.style.margin = '0 auto';
      }
    }
  });
</script>

<div class="w-full flex items-center justify-center p-2">
  <div bind:this={container} class="w-full flex items-center justify-center"></div>
</div>
