/**
 * Squat assessment rules.
 */

import type { AssessmentRule } from '../../types';

export const squatRules: AssessmentRule[] = [
  // --- Depth ---
  {
    id: 'sq-depth-shallow',
    name: 'Shallow Squat',
    testType: 'squat',
    category: 'Depth',
    metricKey: 'depth',
    operator: '>',
    threshold: 120,
    severity: 'mild',
    message: 'Squat depth is limited. Hips did not reach knee level.',
    coaching: 'Work on ankle and hip mobility to achieve greater depth.',
  },
  {
    id: 'sq-depth-very-shallow',
    name: 'Very Shallow Squat',
    testType: 'squat',
    category: 'Depth',
    metricKey: 'depth',
    operator: '>',
    threshold: 140,
    severity: 'moderate',
    message: 'Squat depth is significantly limited.',
    coaching: 'Consider goblet squats and ankle mobility exercises to improve range of motion.',
  },

  // --- Knee Tracking ---
  {
    id: 'sq-knee-valgus-left',
    name: 'Left Knee Valgus in Squat',
    testType: 'squat',
    category: 'Knee Tracking',
    metricKey: 'leftKneeTracking',
    operator: '>',
    threshold: 8,
    severity: 'mild',
    message: 'Left knee collapses inward during squat.',
    coaching: 'Focus on pushing knees out over toes. Banded squats can help.',
  },
  {
    id: 'sq-knee-valgus-right',
    name: 'Right Knee Valgus in Squat',
    testType: 'squat',
    category: 'Knee Tracking',
    metricKey: 'rightKneeTracking',
    operator: '>',
    threshold: 8,
    severity: 'mild',
    message: 'Right knee collapses inward during squat.',
    coaching: 'Focus on pushing knees out over toes. Banded squats can help.',
  },
  {
    id: 'sq-knee-valgus-left-mod',
    name: 'Moderate Left Knee Valgus',
    testType: 'squat',
    category: 'Knee Tracking',
    metricKey: 'leftKneeTracking',
    operator: '>',
    threshold: 15,
    severity: 'moderate',
    message: 'Significant left knee inward collapse during squat.',
    coaching: 'Strengthen hip external rotators with clamshells and lateral band walks.',
  },
  {
    id: 'sq-knee-valgus-right-mod',
    name: 'Moderate Right Knee Valgus',
    testType: 'squat',
    category: 'Knee Tracking',
    metricKey: 'rightKneeTracking',
    operator: '>',
    threshold: 15,
    severity: 'moderate',
    message: 'Significant right knee inward collapse during squat.',
    coaching: 'Strengthen hip external rotators with clamshells and lateral band walks.',
  },

  // --- Hip Shift ---
  {
    id: 'sq-hip-shift',
    name: 'Hip Shift in Squat',
    testType: 'squat',
    category: 'Hip Shift',
    metricKey: 'hipShift',
    operator: '>',
    threshold: 5,
    severity: 'mild',
    message: 'Lateral hip shift observed during squat.',
    coaching: 'Single-leg exercises may help address side-to-side imbalances.',
  },

  // --- Trunk Lean ---
  {
    id: 'sq-trunk-lean-mild',
    name: 'Excessive Forward Lean',
    testType: 'squat',
    category: 'Trunk Lean',
    metricKey: 'trunkLean',
    operator: '>',
    threshold: 35,
    severity: 'mild',
    message: 'Excessive forward trunk lean during squat.',
    coaching: 'This may indicate tight ankles or weak quads. Try elevated heel squats.',
  },
  {
    id: 'sq-trunk-lean-mod',
    name: 'Significant Forward Lean',
    testType: 'squat',
    category: 'Trunk Lean',
    metricKey: 'trunkLean',
    operator: '>',
    threshold: 50,
    severity: 'moderate',
    message: 'Significant forward trunk lean during squat.',
    coaching: 'Work on thoracic extension and ankle dorsiflexion mobility.',
  },

  // --- Heel Lift ---
  {
    id: 'sq-heel-lift',
    name: 'Heel Lift',
    testType: 'squat',
    category: 'Heel Lift',
    metricKey: 'heelLift',
    operator: '>',
    threshold: 3,
    severity: 'mild',
    message: 'Heels appear to lift during squat.',
    coaching: 'Ankle mobility work, especially calf stretches and ankle circles.',
  },

  // --- Asymmetry ---
  {
    id: 'sq-asymmetry',
    name: 'Squat Asymmetry',
    testType: 'squat',
    category: 'Asymmetry',
    metricKey: 'asymmetry',
    operator: '>',
    threshold: 8,
    severity: 'mild',
    message: 'Left/right asymmetry observed during squat.',
    coaching: 'Single-leg exercises like Bulgarian split squats can help balance both sides.',
  },
];
