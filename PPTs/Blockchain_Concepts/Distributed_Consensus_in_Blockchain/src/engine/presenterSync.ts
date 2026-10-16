// The presenter window is a separate browser window/tab (so it never shows on a mirrored
// or extended HDMI output) — it has no access to the main window's React tree or Zustand
// store, so BroadcastChannel is the only way to keep it in sync.
export const PRESENTER_CHANNEL = 'quorum-presenter-sync';

export type PresenterMessage =
  | { type: 'request' }
  | { type: 'state'; slideIndex: number; stepIndex: number };

export const openPresenter = () =>
  window.open(`${location.pathname}#/presenter`, 'quorum_presenter', 'width=460,height=760');
