<script lang="ts">
  interface Props {
    code: string;
    height?: number;
    aspectRatio?: string;
  }

  let { code, height = 350, aspectRatio }: Props = $props();

  const iframeSrcDoc = $derived(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: ui-sans-serif, system-ui, sans-serif;
      background: transparent;
    }
    canvas {
      display: block;
      max-width: 100%;
      max-height: 100%;
    }
  </style>
</head>
<body>
  ${code}
</body>
</html>`);
</script>

<div class="w-full flex items-center justify-center p-1">
  <iframe
    title="Sandboxed Visualization"
    srcdoc={iframeSrcDoc}
    sandbox="allow-scripts"
    class="w-full border-0 rounded-lg overflow-hidden bg-transparent"
    style="height: {height}px; {aspectRatio ? `aspect-ratio: ${aspectRatio};` : ''}"
  ></iframe>
</div>
