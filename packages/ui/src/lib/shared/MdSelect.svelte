<script lang="ts">
  import Md from './Md.svelte';

  interface SelectOption {
    id: string;
    text: string; // may contain Markdown / KaTeX
  }

  interface Props {
    options: SelectOption[];
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    /** Render as inline-block for use inside flowing text (e.g. FillGaps). */
    inline?: boolean;
    onChange: (value: string) => void;
  }

  let {
    options,
    value = '',
    placeholder = '— select —',
    disabled = false,
    inline = false,
    onChange,
  }: Props = $props();

  let open = $state(false);

  const selected = $derived(options.find((o) => o.id === value));
  const display = $derived(selected?.text ?? placeholder);

  function pick(id: string) {
    onChange(id);
    open = false;
  }

  /** Close when focus leaves the whole widget (tabbing away, clicking outside). */
  function onFocusOut(e: FocusEvent) {
    const container = e.currentTarget as HTMLElement;
    if (!container.contains(e.relatedTarget as Node | null)) {
      open = false;
    }
  }
</script>

<div
  class={inline ? 'relative inline-block align-middle' : 'relative w-full'}
  onfocusout={onFocusOut}
>
  <!-- Trigger button styled like a DaisyUI select -->
  <button
    type="button"
    class={[
      'select select-bordered flex items-center justify-between text-left',
      inline ? 'h-auto min-h-8 w-auto px-2 py-1 text-sm' : 'h-auto min-h-12 w-full py-2',
    ]}
    {disabled}
    onclick={() => {
      if (!disabled) open = !open;
    }}
    aria-haspopup="listbox"
    aria-expanded={open}
  >
    <span class="min-w-0 flex-1 truncate">
      <Md content={display} inline />
    </span>
    <!-- Chevron -->
    <svg
      class="ml-2 h-4 w-4 shrink-0 transition-transform"
      class:rotate-180={open}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fill-rule="evenodd"
        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
        clip-rule="evenodd"
      />
    </svg>
  </button>

  <!-- Dropdown listbox -->
  {#if open}
    <ul
      role="listbox"
      class="border-base-300 bg-base-200 rounded-box absolute z-50 mt-1 max-h-64 w-full overflow-y-auto border shadow-lg"
    >
      <!-- Empty / unset option -->
      <li>
        <button
          type="button"
          role="option"
          aria-selected={value === ''}
          class="text-base-content/60 w-full px-3 py-2 text-left italic hover:bg-base-300"
          onclick={() => pick('')}
          tabindex="0"
        >
          {placeholder}
        </button>
      </li>

      {#each options as opt (opt.id)}
        <li>
          <button
            type="button"
            role="option"
            aria-selected={value === opt.id}
            class={[
              'w-full px-3 py-2 text-left hover:bg-base-300',
              value === opt.id ? 'bg-primary/10 font-medium text-primary' : '',
            ]}
            onclick={() => pick(opt.id)}
            tabindex="0"
          >
            <Md content={opt.text} inline />
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
