export const STANDARD_EASE = [0.32, 0.72, 0, 1] as const;
export const SOFT_EASE = [0.33, 1, 0.68, 1] as const;

export const transitions = {
  entrance: { duration: 0.28, ease: STANDARD_EASE },
  quick: { duration: 0.18, ease: SOFT_EASE },
  linger: { duration: 0.32, ease: STANDARD_EASE },
};

export const variants = {
  fadeInUp: {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
  },
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  scaleFade: {
    initial: { opacity: 0, scale: 0.94 },
    animate: { opacity: 1, scale: 1 },
  },
};

export const interactions = {
  hoverScale: { scale: 1.03 },
  tapScale: { scale: 0.97 },
};

export const panelRevealVariants = {
  expanded: { opacity: 1, scaleX: 1, scaleY: 1, y: 0 },
  collapsed: { opacity: 0, scaleX: 0.92, scaleY: 0.7, y: 12 },
};

export const panelRevealTransition = {
  duration: 0.24,
  ease: STANDARD_EASE,
};
