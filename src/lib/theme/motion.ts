export const motion = {
  duration: {
    instant: 100,
    fast: 180,
    normal: 280,
    slow: 420,
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    emphasized: "cubic-bezier(0.2, 0, 0, 1)",
  },
  presets: {
    fadeIn: "fadeIn",
    fadeSlideUp: "fadeSlideUp",
    heroParallax: "heroParallax",
    pressScale: "pressScale",
    sheetPresent: "sheetPresent",
  },
} as const;
