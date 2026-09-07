export const interactionContracts = [
  {
    id: 'homepage-scroll-story',
    route: '/',
    root: '[data-bg-story-root]',
    viewports: ['desktop', 'mobile'],
    states: ['0', '1', '2', '3'],
    triggers: ['scroll', 'click'],
    requires: {
      keyboard: true,
      reducedMotion: true,
      overlapGuard: true,
    },
    hooks: {
      state: 'data-bg-story-state',
      step: 'data-bg-story-step',
      overlay: 'data-bg-story-overlay',
    },
  },
  {
    id: 'homepage-platform-expertise-toggle',
    route: '/',
    root: '[data-bg-platform-expertise-toggle]',
    viewports: ['desktop', 'mobile'],
    states: ['platform', 'expertise'],
    triggers: ['click', 'keyboard'],
    requires: {
      keyboard: true,
      reducedMotion: false,
      overlapGuard: false,
    },
    hooks: {
      state: 'aria-selected',
      step: 'role=tab',
      overlay: 'role=tabpanel',
    },
  },
];
