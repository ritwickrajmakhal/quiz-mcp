<script lang="ts">
  import type { FillGapsQuestion, FillGapsAnswer } from '@quiz-mcp/core';
  import { useI18n } from '../i18n-svelte.js';
  import Md from '../shared/Md.svelte';
  import MdSelect from '../shared/MdSelect.svelte';

  interface Props {
    question: FillGapsQuestion;
    value?: FillGapsAnswer;
    disabled?: boolean;
    onChange: (answer: FillGapsAnswer) => void;
  }

  let { question, value, disabled = false, onChange }: Props = $props();

  const t = useI18n();
  const fills = $derived<Record<string, string>>(value?.fills ?? {});

  function setGap(gapId: string, v: string) {
    onChange({
      _kind: 'fill_gaps',
      questionId: question.id,
      fills: { ...fills, [gapId]: v },
    });
  }
</script>

<div class="text-base-content text-base leading-loose">
  {#each question.parts as part, i (i)}
    {#if part._kind === 'text'}<Md content={part.content} inline />{:else if part._kind === 'text_gap'}<input
        type="text"
        class="input input-bordered input-sm inline-block w-40 align-middle"
        placeholder={part.placeholder ?? t('question.fillgaps.gap_placeholder')}
        value={fills[part.gapId] ?? ''}
        {disabled}
        oninput={(e) => setGap(part.gapId, (e.currentTarget as HTMLInputElement).value)}
      />{:else}<MdSelect
        inline
        options={part.options.map((o) => ({ id: o.id, text: o.label }))}
        value={fills[part.gapId] ?? ''}
        placeholder="—"
        {disabled}
        onChange={(val) => setGap(part.gapId, val)}
      />{/if}
  {/each}
</div>
