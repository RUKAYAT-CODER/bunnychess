import { computed, ref } from 'vue';

/**
 * Convert milliseconds to MM:SS string.
 *
 * @param ms milliseconds
 * @returns MM:SS string, e.g. msToMMSS(84000) === '01:24'
 */
function msToMMSS(ms: number): string {
  return `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(
    Math.floor(ms / 1000) % 60
  ).padStart(2, '0')}`;
}

type TurnColor = 'w' | 'b';
type ClockValues = { w: number; b: number };

/**
 * A chess clock for two players.
 *
 * @param values remaining time in milliseconds for each player
 * @param turnColor which player's turn it is
 */
export function useChessClock(values: ClockValues, turnColor: TurnColor = 'w') {
  const clocks = ref<ClockValues>({ ...values });
  const turn = ref<TurnColor>(turnColor);
  const disabled = ref<boolean>(false);

  const mmssClocks = computed<{ w: string; b: string }>(() => ({
    w: msToMMSS(clocks.value.w),
    b: msToMMSS(clocks.value.b)
  }));
  const timedOutColor = computed<TurnColor | undefined>(() =>
    clocks.value.w === 0 ? 'w' : clocks.value.b === 0 ? 'b' : undefined
  );

  let interval: number | undefined;

  /**
   * Start current turn clock if not already started or timed out.
   */
  function start(): void {
    if (interval != null || timedOutColor.value || disabled.value) {
      return;
    }
    const startingValue = clocks.value[turn.value];
    const start = Date.now();
    // Use setInterval to update clock every 50ms based on elapsed time since start.
    // Way better than using setInterval/setTimeout to decrease clock value by 1000 every second, which is not an accurate way to keep time.
    interval = window.setInterval(() => {
      clocks.value[turn.value] = Math.max(0, startingValue - (Date.now() - start));
      if (timedOutColor.value) {
        return;
      }
    }, 50);
  }

  /**
   * Pause current turn clock.
   */
  function pause() {
    if (interval != null) {
      window.clearInterval(interval);
      interval = undefined;
    }
  }

  /**
   * Switch turn and start new clock.
   *
   * @param increment amount to add to current clock before switching turn
   */
  function press(increment?: number): void {
    if (disabled.value) {
      return;
    }
    clocks.value[turn.value] += increment ?? 0;
    pause();
    turn.value = turn.value === 'w' ? 'b' : 'w';
    start();
  }

  /**
   * Reset clocks to arbitrary values, setting turn if provided.
   *
   * @param values new clock values
   * @param turnColor which player's turn it is
   */
  function set(values: ClockValues, turnColor?: TurnColor): void {
    pause();
    clocks.value = values;
    if (turnColor) {
      turn.value = turnColor;
    }
  }

  return {
    clocks,
    mmssClocks,
    timedOutColor,

    start,
    pause,
    press,
    set,
    turn,
    disabled
  };
}
