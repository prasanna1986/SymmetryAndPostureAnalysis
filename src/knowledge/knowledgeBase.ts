/**
 * Structured knowledge base for corrective exercise recommendations.
 * Maps posture/movement findings to exercises, awareness tips, and daily habits.
 */

import type { KnowledgeEntry, Exercise } from '../types';

// ---- Exercise Library ----

const exercises: Record<string, Exercise> = {
  chinTucks: {
    id: 'chin-tucks',
    name: 'Chin Tucks',
    description: 'Retract the chin straight back to align the head over the spine.',
    category: 'mobility',
    targetArea: 'Cervical Spine',
    instructions: [
      'Sit or stand tall with shoulders relaxed.',
      'Gently draw your chin straight back, as if making a double chin.',
      'Hold for 5 seconds, then release.',
      'Keep your eyes level — do not tilt your head up or down.',
    ],
    dosage: '3 sets of 10 reps, 2-3 times daily',
    difficulty: 'beginner',
  },
  wallAngels: {
    id: 'wall-angels',
    name: 'Wall Angels',
    description: 'Improve shoulder mobility and upper back extension against a wall.',
    category: 'mobility',
    targetArea: 'Shoulders & Thoracic Spine',
    instructions: [
      'Stand with your back flat against a wall, feet 6 inches from the wall.',
      'Press your lower back, upper back, and head into the wall.',
      'Raise arms to shoulder height with elbows bent 90°, press backs of hands into the wall.',
      'Slowly slide arms up overhead, maintaining contact with the wall.',
      'Return to the starting position.',
    ],
    dosage: '3 sets of 10 reps',
    difficulty: 'beginner',
  },
  doorwayStretch: {
    id: 'doorway-stretch',
    name: 'Doorway Pec Stretch',
    description: 'Stretch the chest muscles to counteract rounded shoulders.',
    category: 'mobility',
    targetArea: 'Chest & Anterior Shoulders',
    instructions: [
      'Stand in a doorway with arms raised to shoulder height, elbows bent 90°.',
      'Place forearms on the door frame.',
      'Step one foot forward and lean gently through the doorway.',
      'You should feel a stretch across the chest.',
      'Hold for 30 seconds.',
    ],
    dosage: '3 sets of 30 seconds, each side',
    difficulty: 'beginner',
  },
  bandPullApart: {
    id: 'band-pull-apart',
    name: 'Band Pull-Aparts',
    description: 'Strengthen the upper back and rear shoulders.',
    category: 'strength',
    targetArea: 'Upper Back & Rear Delts',
    instructions: [
      'Hold a resistance band at shoulder height with arms extended.',
      'Pull the band apart by squeezing your shoulder blades together.',
      'Slowly return to the start position.',
      'Keep your core engaged and avoid arching your back.',
    ],
    dosage: '3 sets of 15 reps',
    difficulty: 'beginner',
  },
  clamshells: {
    id: 'clamshells',
    name: 'Clamshells',
    description: 'Strengthen the hip external rotators to improve knee alignment.',
    category: 'strength',
    targetArea: 'Hip External Rotators',
    instructions: [
      'Lie on your side with hips and knees bent 45°.',
      'Keep feet together and lift the top knee as high as comfortable.',
      'Do not let your pelvis roll backward.',
      'Lower slowly.',
    ],
    dosage: '3 sets of 15 reps each side',
    difficulty: 'beginner',
  },
  gluteBridge: {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    description: 'Strengthen glutes and improve hip extension.',
    category: 'strength',
    targetArea: 'Glutes & Hamstrings',
    instructions: [
      'Lie on your back with knees bent, feet flat on the floor.',
      'Squeeze your glutes and lift your hips toward the ceiling.',
      'Hold at the top for 2 seconds.',
      'Lower slowly.',
    ],
    dosage: '3 sets of 12 reps',
    difficulty: 'beginner',
  },
  hipFlexorStretch: {
    id: 'hip-flexor-stretch',
    name: 'Half-Kneeling Hip Flexor Stretch',
    description: 'Stretch tight hip flexors that contribute to pelvic tilt.',
    category: 'mobility',
    targetArea: 'Hip Flexors',
    instructions: [
      'Kneel on one knee with the other foot flat in front.',
      'Tuck your pelvis slightly (posterior tilt).',
      'Shift weight gently forward until you feel a stretch in the front of the kneeling hip.',
      'Hold for 30 seconds.',
    ],
    dosage: '3 sets of 30 seconds each side',
    difficulty: 'beginner',
  },
  lateralBandWalk: {
    id: 'lateral-band-walk',
    name: 'Lateral Band Walks',
    description: 'Strengthen hip abductors for better knee and pelvic control.',
    category: 'strength',
    targetArea: 'Hip Abductors',
    instructions: [
      'Place a resistance band around your ankles or just above your knees.',
      'Stand in a quarter squat position.',
      'Take 10 steps to the right, maintaining tension on the band.',
      'Then 10 steps to the left.',
    ],
    dosage: '3 sets of 10 steps each direction',
    difficulty: 'beginner',
  },
  deadBug: {
    id: 'dead-bug',
    name: 'Dead Bug',
    description: 'Core stability exercise that teaches anti-extension.',
    category: 'strength',
    targetArea: 'Core',
    instructions: [
      'Lie on your back with arms pointed toward the ceiling.',
      'Bend hips and knees to 90°.',
      'Slowly extend one arm overhead while extending the opposite leg.',
      'Return to the start and alternate sides.',
      'Keep your lower back pressed into the floor throughout.',
    ],
    dosage: '3 sets of 8 reps each side',
    difficulty: 'beginner',
  },
  calfStretch: {
    id: 'calf-stretch',
    name: 'Wall Calf Stretch',
    description: 'Improve ankle dorsiflexion for better squat mechanics.',
    category: 'mobility',
    targetArea: 'Calves & Ankles',
    instructions: [
      'Stand facing a wall, one foot forward and one foot back.',
      'Keep the back heel on the ground and lean into the wall.',
      'You should feel a stretch in the back calf.',
      'Hold for 30 seconds, then switch sides.',
    ],
    dosage: '3 sets of 30 seconds each side',
    difficulty: 'beginner',
  },
  singleLegRDL: {
    id: 'single-leg-rdl',
    name: 'Single-Leg Romanian Deadlift',
    description: 'Improve hip stability, balance, and posterior chain strength.',
    category: 'strength',
    targetArea: 'Glutes, Hamstrings & Balance',
    instructions: [
      'Stand on one leg with a slight knee bend.',
      'Hinge at the hips, extending the free leg behind you.',
      'Lower your torso until roughly parallel to the floor.',
      'Return to standing by driving through the standing heel.',
    ],
    dosage: '3 sets of 8 reps each side',
    difficulty: 'intermediate',
  },
  catCow: {
    id: 'cat-cow',
    name: 'Cat-Cow Stretch',
    description: 'Improve spinal mobility through flexion and extension.',
    category: 'mobility',
    targetArea: 'Spine',
    instructions: [
      'Start on hands and knees in a tabletop position.',
      'Inhale: drop your belly, lift your chest and tailbone (cow).',
      'Exhale: round your spine, tuck your chin and tailbone (cat).',
      'Move slowly between positions.',
    ],
    dosage: '2 sets of 10 cycles',
    difficulty: 'beginner',
  },
};

// ---- Knowledge Base Entries ----

export const knowledgeBase: KnowledgeEntry[] = [
  {
    id: 'forward-head',
    name: 'Forward Head Posture',
    description: 'The head is positioned anterior to the shoulder line, increasing cervical spine load.',
    criteria: [{ metricKey: 'forwardHeadAngle', minValue: 8 }],
    recommendations: {
      mobility: [exercises.chinTucks, exercises.catCow],
      strength: [exercises.bandPullApart, exercises.deadBug],
      awareness: [
        'Set hourly reminders to check head position.',
        'Position your monitor at eye level.',
        'When using a phone, bring it up to eye level instead of looking down.',
      ],
      dailyHabits: [
        'Take breaks from screens every 30 minutes.',
        'Use a supportive pillow that maintains neutral neck position.',
        'Be mindful of head position during prolonged sitting.',
      ],
    },
  },
  {
    id: 'rounded-shoulders',
    name: 'Rounded Shoulders',
    description: 'Shoulders are rotated forward, indicating tight chest muscles and weak upper back.',
    criteria: [{ metricKey: 'shoulderRotation', minValue: 5 }],
    recommendations: {
      mobility: [exercises.doorwayStretch, exercises.wallAngels],
      strength: [exercises.bandPullApart],
      awareness: [
        'Periodically squeeze your shoulder blades together.',
        'Avoid prolonged positions with arms in front of you.',
      ],
      dailyHabits: [
        'Set up your workstation so your elbows rest at your sides.',
        'Sleep on your back or side with proper support.',
      ],
    },
  },
  {
    id: 'shoulder-elevation',
    name: 'Shoulder Height Asymmetry',
    description: 'One shoulder sits higher than the other, possibly from muscle imbalance or habitual posture.',
    criteria: [{ metricKey: 'shoulderHeightDiff', minValue: 3 }],
    recommendations: {
      mobility: [exercises.doorwayStretch],
      strength: [exercises.bandPullApart],
      awareness: [
        'Notice if you tend to carry bags on one shoulder.',
        'Check for tension in the upper trapezius on the elevated side.',
      ],
      dailyHabits: [
        'Alternate the side you carry bags on.',
        'Practice shoulder shrugs and releases to reduce tension.',
      ],
    },
  },
  {
    id: 'pelvic-tilt-lateral',
    name: 'Lateral Pelvic Tilt',
    description: 'The pelvis is tilted to one side, which can affect the entire kinetic chain.',
    criteria: [{ metricKey: 'pelvicTilt', minValue: 3 }],
    recommendations: {
      mobility: [exercises.hipFlexorStretch, exercises.catCow],
      strength: [exercises.clamshells, exercises.gluteBridge, exercises.lateralBandWalk],
      awareness: [
        'Stand with weight evenly distributed on both feet.',
        'Avoid standing with weight shifted habitually to one side.',
      ],
      dailyHabits: [
        'When standing for long periods, shift weight consciously between feet.',
        'Avoid crossing legs while sitting.',
      ],
    },
  },
  {
    id: 'knee-valgus',
    name: 'Knee Valgus',
    description: 'Knees collapse inward, often due to weak hip external rotators or tight adductors.',
    criteria: [
      { metricKey: 'leftKneeAngle', minValue: 5 },
      { metricKey: 'rightKneeAngle', minValue: 5 },
    ],
    recommendations: {
      mobility: [exercises.hipFlexorStretch],
      strength: [exercises.clamshells, exercises.lateralBandWalk, exercises.gluteBridge],
      awareness: [
        'When squatting, focus on pushing your knees out over your toes.',
        'Be mindful of knee position when climbing stairs.',
      ],
      dailyHabits: [
        'Avoid sitting with knees together for prolonged periods.',
        'Practice mini-squats with proper knee tracking throughout the day.',
      ],
    },
  },
  {
    id: 'trunk-lean',
    name: 'Trunk Lean',
    description: 'The trunk leans to one side during standing, indicating lateral muscle imbalance.',
    criteria: [{ metricKey: 'trunkLean', minValue: 4 }],
    recommendations: {
      mobility: [exercises.catCow],
      strength: [exercises.deadBug],
      awareness: [
        'Check your posture in a mirror periodically.',
        'Be aware of leaning to one side when tired.',
      ],
      dailyHabits: [
        'Practice standing tall with equal weight on both feet.',
        'Strengthen your core with anti-lateral-flexion exercises.',
      ],
    },
  },
  {
    id: 'squat-depth-limited',
    name: 'Limited Squat Depth',
    description: 'Unable to achieve adequate squat depth, often due to ankle or hip mobility restrictions.',
    criteria: [{ metricKey: 'depth', minValue: 120 }],
    recommendations: {
      mobility: [exercises.calfStretch, exercises.hipFlexorStretch],
      strength: [exercises.gluteBridge],
      awareness: [
        'Try squatting with a wider stance or toes turned out slightly.',
        'Use a small heel elevation if ankle mobility is the limiting factor.',
      ],
      dailyHabits: [
        'Practice deep squat holds for 30 seconds several times daily.',
        'Stretch calves and hip flexors after sitting for long periods.',
      ],
    },
  },
  {
    id: 'hip-instability',
    name: 'Hip Instability (Single-Leg)',
    description: 'Excessive lateral sway or pelvic drop during single-leg stance, indicating weak hip stabilizers.',
    criteria: [
      { metricKey: 'hipStability', minValue: 8 },
      { metricKey: 'pelvicDrop', minValue: 5 },
    ],
    recommendations: {
      mobility: [exercises.hipFlexorStretch],
      strength: [exercises.clamshells, exercises.lateralBandWalk, exercises.singleLegRDL],
      awareness: [
        'Practice single-leg balance while brushing teeth.',
        'Focus on keeping hips level during walking.',
      ],
      dailyHabits: [
        'Incorporate balance challenges into daily routine.',
        'Stand on one leg for 30 seconds several times daily.',
      ],
    },
  },
];
