/**
 * Scroll state, and the only way anything talks about it.
 *
 * `scroll.ts` writes; the scene, the chrome and the opening reveal read. Kept
 * deliberately dumb — a plain object and a listener set — so there is no
 * framework in the hot path and one frame of scrolling costs one assignment.
 */

export interface ScrollState {
  /** Camera parameter, 0 … LAST_PARAM. */
  readonly param: number;
  /** Section id currently on screen, for the navigation. */
  readonly activeId: string;
  /** 0 … 1 across the whole page, for the progress rule. */
  readonly progress: number;
}

type Listener = (state: ScrollState) => void;

let state: ScrollState = { param: 0, activeId: 'entry', progress: 0 };
const listeners = new Set<Listener>();

export function getScrollState(): ScrollState {
  return state;
}

export function setScrollState(next: ScrollState): void {
  if (
    next.param === state.param &&
    next.activeId === state.activeId &&
    next.progress === state.progress
  ) {
    return;
  }
  state = next;
  for (const listener of listeners) {
    listener(state);
  }
}

export function subscribeScroll(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
