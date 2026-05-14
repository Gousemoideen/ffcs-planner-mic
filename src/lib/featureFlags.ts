export const FEATURE_FLAGS = {
  facultyFirstPreferenceFlow: 'faculty_first_preference_flow',
} as const;

export type FeatureFlagName = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];
