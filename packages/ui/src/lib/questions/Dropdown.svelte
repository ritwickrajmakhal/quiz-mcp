<script lang="ts">
  import type { DropdownQuestion, DropdownAnswer } from '@quiz-mcp/core';
  import { useI18n } from '../i18n-svelte.js';
  import Md from '../shared/Md.svelte';
  import MdSelect from '../shared/MdSelect.svelte';

  interface Props {
    question: DropdownQuestion;
    value?: DropdownAnswer;
    disabled?: boolean;
    onChange: (answer: DropdownAnswer) => void;
  }

  let { question, value, disabled = false, onChange }: Props = $props();

  const t = useI18n();
  const selections = $derived(value?.selections ?? []);
  const labelById = $derived(
    new Map(question.options.map((o) => [o.id, o.label] as const)),
  );

  let tagDraft = $state('');

  function emit(selections: string[]) {
    onChange({ _kind: 'dropdown', questionId: question.id, selections });
  }

  function toggleOption(id: string) {
    emit(selections.includes(id) ? selections.filter((s) => s !== id) : [...selections, id]);
  }

  function toggleTag(v: string) {
    emit(selections.includes(v) ? selections.filter((s) => s !== v) : [...selections, v]);
  }

  function addTagDraft() {
    const v = tagDraft.trim();
    if (!v || selections.includes(v)) {
      tagDraft = '';
      return;
    }
    emit([...selections, v]);
    tagDraft = '';
  }

  function onTagKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTagDraft();
    }
  }
</script>

<div class="flex flex-col gap-1">
  {#if question.mode === 'single'}
    <MdSelect
      options={question.options.map((o) => ({ id: o.id, text: o.label }))}
      value={selections[0] ?? ''}
      placeholder={t('question.dropdown.placeholder')}
      {disabled}
      onChange={(val) => emit(val ? [val] : [])}
    />
  {:else if question.mode === 'multiple'}
    <div class="border-base-300 rounded-box flex flex-col gap-1 border p-2">
      {#each question.options as option (option.id)}
        {@const checked = selections.includes(option.id)}
        <label
          class={[
            'label hover:bg-base-200 flex cursor-pointer items-start gap-3 rounded-box p-2',
            checked ? 'bg-primary/5' : '',
          ]}
        >
          <input
            type="checkbox"
            class="checkbox checkbox-primary checkbox-sm mt-0.5"
            {checked}
            {disabled}
            onchange={() => toggleOption(option.id)}
          />
          <span class="label-text text-base-content">
            <Md content={option.label} inline />
          </span>
        </label>
      {/each}
    </div>
    <div class="text-base-content/60 mt-1 text-xs">{t('question.dropdown.multiselect_hint')}</div>
  {:else}
    <div class="flex flex-wrap gap-2">
      {#each question.options as option (option.id)}
        {@const active = selections.includes(option.id)}
        <button
          type="button"
          class="badge badge-lg cursor-pointer"
          class:badge-primary={active}
          class:badge-outline={!active}
          {disabled}
          onclick={() => toggleTag(option.id)}
        >
          <Md content={option.label} inline />
        </button>
      {/each}
    </div>

    <div class="divider my-2"></div>

    <div class="flex flex-wrap items-center gap-2">
      {#each selections.filter((s) => !labelById.has(s)) as tag (tag)}
        <span class="badge badge-accent gap-1">
          {tag}
          <button
            type="button"
            class="btn btn-xs btn-circle btn-ghost"
            aria-label={t('button.remove_tag_aria')}
            onclick={() => toggleTag(tag)}
          >
            ✕
          </button>
        </span>
      {/each}

      <div class="join">
        <input
          type="text"
          class="input input-bordered input-sm join-item"
          placeholder={t('question.dropdown.custom_tag_placeholder')}
          bind:value={tagDraft}
          onkeydown={onTagKey}
          {disabled}
        />
        <button type="button" class="btn btn-sm btn-primary join-item" onclick={addTagDraft}>
          {t('button.add_tag')}
        </button>
      </div>
    </div>
  {/if}
</div>
