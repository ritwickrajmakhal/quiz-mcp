<script lang="ts">
  import { useI18n } from '../i18n-svelte.js';

  interface Props {
    timeLimitSeconds?: number;
    elapsedSeconds?: number;
  }

  let { timeLimitSeconds, elapsedSeconds = $bindable(0) }: Props = $props();
  const t = useI18n();

  const hasLimit = $derived(typeof timeLimitSeconds === 'number' && timeLimitSeconds > 0);
  const isOvertime = $derived(hasLimit && elapsedSeconds > (timeLimitSeconds ?? 0));
  const remainingSeconds = $derived(
    hasLimit ? Math.max(0, (timeLimitSeconds ?? 0) - elapsedSeconds) : 0,
  );
  const overtimeSeconds = $derived(
    isOvertime ? elapsedSeconds - (timeLimitSeconds ?? 0) : 0,
  );
  const isWarning = $derived(
    hasLimit &&
      !isOvertime &&
      (remainingSeconds <= 60 || remainingSeconds <= (timeLimitSeconds ?? 0) * 0.15),
  );
  const progressPercent = $derived(
    hasLimit ? Math.min(100, Math.round((elapsedSeconds / (timeLimitSeconds ?? 1)) * 100)) : 0,
  );

  function formatTime(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  }

  $effect(() => {
    const startTime = Date.now() - elapsedSeconds * 1000;
    const timer = setInterval(() => {
      const now = Date.now();
      elapsedSeconds = Math.max(0, Math.floor((now - startTime) / 1000));
    }, 500);

    return () => clearInterval(timer);
  });
</script>

<div
  class="rounded-box border border-base-300 bg-base-100 p-3.5 shadow-xs transition-colors"
  class:border-error={isOvertime}
  class:border-warning={isWarning}
>
  <div class="flex items-center justify-between gap-3">
    <div class="flex items-center gap-3 min-w-0">
      <div
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors {isOvertime
          ? 'bg-error/15 text-error'
          : isWarning
            ? 'bg-warning/20 text-warning'
            : 'bg-primary/10 text-primary'}"
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-base-content/60">
            {#if isOvertime}
              Overtime
            {:else if hasLimit}
              Time Remaining
            {:else}
              Time Elapsed
            {/if}
          </span>
          {#if isOvertime}
            <span class="badge badge-error badge-xs font-sans font-medium">
              Overtime
            </span>
          {/if}
        </div>

        <div
          class="flex items-baseline gap-2 font-mono font-bold tracking-tight {isOvertime
            ? 'text-error'
            : isWarning
              ? 'text-warning'
              : 'text-base-content'}"
        >
          <span class="text-xl leading-tight">
            {#if isOvertime}
              +{formatTime(overtimeSeconds)}
            {:else if hasLimit}
              {formatTime(remainingSeconds)}
            {:else}
              {formatTime(elapsedSeconds)}
            {/if}
          </span>
          {#if isOvertime}
            <span class="text-xs font-normal font-sans text-base-content/60 hidden sm:inline">
              (keeps going, no auto-submit)
            </span>
          {/if}
        </div>
      </div>
    </div>

    {#if hasLimit}
      <div class="text-right shrink-0">
        <div class="text-[11px] font-medium uppercase tracking-wider text-base-content/60">
          Target
        </div>
        <div class="text-sm font-semibold font-mono text-base-content/80">
          {formatTime(timeLimitSeconds ?? 0)}
        </div>
      </div>
    {/if}
  </div>

  {#if hasLimit}
    <div
      class="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-base-200"
      role="progressbar"
      aria-valuenow={progressPercent}
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="h-full transition-all duration-300 {isOvertime
          ? 'bg-error'
          : isWarning
            ? 'bg-warning'
            : 'bg-primary'}"
        style="width: {progressPercent}%"
      ></div>
    </div>
  {/if}
</div>