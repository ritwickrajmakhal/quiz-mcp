<script lang="ts" module>
  import { marked } from 'marked';
  import markedKatex from 'marked-katex-extension';
  import { markedHighlight } from 'marked-highlight';
  import hljs from 'highlight.js';

  // Configure once at module level — shared across all Md instances.
  marked.use(markedKatex({ throwOnError: false, nonStandard: true }));
  marked.use(
    markedHighlight({
      emptyLangClass: 'hljs',
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
      },
    }),
  );
</script>

<script lang="ts">
  interface Props {
    content: string;
    /** Use parseInline to avoid wrapping <p> tags — ideal for labels inside form controls. */
    inline?: boolean;
  }

  let { content, inline = false }: Props = $props();

  const html = $derived(
    inline
      ? (marked.parseInline(content) as string)
      : (marked.parse(content) as string),
  );
</script>

<!--
  prose / prose-sm: typography styles for tables, code blocks, headings, lists, etc.
  max-w-none: removes the default max-width cap so content fills its container.
  dark:prose-invert: flips prose colors when DaisyUI dark theme is active.
  <div> is required (not <span>) because block elements like <table>/<pre> are valid children.
-->
<div class="prose prose-sm max-w-none dark:prose-invert">{@html html}</div>

