export const FEATURE_FLAGS = {
  betaTimetableFlow: 'beta_timetable_flow',
} as const;

export type FeatureFlagName = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];
