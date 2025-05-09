// js/config.js
export const CONFIG = {
    innings: 9,
    baseProbabilities: {
        strikeout: 0.21,
        walk: 0.08,
        homeRun: 0.045,
        otherHit: 0.195,
    },
    stamina: {
        penaltyThreshold1: 0.50,
        penaltyAmount1: 1,
        penaltyThreshold2: 0.30,
        penaltyAmount2: 2,
        depletionPerBatterMin: 2,
        depletionPerBatterMax: 4
    },
    speed: {
        stretchSingleToDoubleFast: 0.30,
        stretchSingleToDoubleMedium: 0.15,
        runnerExtraBaseFast: 0.40,
        runnerExtraBaseMedium: 0.20,
        baseHitIsDoubleChance: 0.25
    },
    ovrWeights: {
         batter: {
            power: 2.8, hitRate: 2.8, contact: 2.2, speed: 1.2,
            scale: 1, base: 25
        },
        pitcher: {
            power: 3.0, // "Stuff"
            velocity: 3.0,
            control: 2.5,
            technique: 1.5, // "Movement/Deception"
            staminaEffect: 2.0, // How much maxStamina contributes to OVR
            scale: 1, // Multiplier for the sum of weighted stats
            base: 25  // Base OVR before adding stat contributions
        }
    },
    statNormalization: {
        pitcherPowerEffectOnSO: 0.027,
        velocityEffectOnSO: 0.022,
        velocityEffectOnHit: -0.017,
        techniqueEffectOnHR: -0.015,
        techniqueEffectOnSO: 0.01, // Slight increase with technique
        batterContactEffectOnSO: -0.030,
        pitcherControlEffectOnWalk: -0.025,
        batterPowerEffectOnHR: 0.008,
        pitcherPowerEffectOnHR: -0.0025,
        batterHitRateEffectOnHit: 0.025,
        pitcherPowerEffectOnHit: -0.017
    },
    probabilityCaps: {
        strikeout: { min: 0.05, max: 0.50 },
        walk: { min: 0.02, max: 0.30 },
        homeRun: { min: 0.005, max: 0.10 },
        otherHit: { min: 0.05, max: 0.40 },
        outMin: 0.10, // Minimum probability for a generic out
        sumOfDeterminedRatesCap: 0.95 // Max sum for SO, BB, HR, OtherHit before calculating generic out
    },
    statColors: { // For individual stat value display (1-10)
        low: 3,
        medium: 6,
        high: 8,
        elite: 10
    },
    // NEW: OVR Color Theming
    ovrColorSettings: {
        thresholds: { // Upper bound for each tier
            gray: 73,   // OVR <= 73
            blue: 80,   // 73 <= OVR <= 80
            red: 87,    // 80 <= OVR <= 87
            green: 94,  // 87 <= OVR <= 94
            golden: 99  // 95 <= OVR <= 99
        },
        classes: { // Corresponding CSS class names
            gray: 'ovr-tier-gray',
            blue: 'ovr-tier-blue',
            red: 'ovr-tier-red',
            green: 'ovr-tier-green',
            golden: 'ovr-tier-golden'
        },
        // Define actual colors here or purely in CSS. Keeping them here for reference.
        colors: {
            gray: { border: '#adb5bd', background: '#f8f9fa', text: '#6c757d' },
            blue: { border: '#0d6efd', background: '#e3e1ef', text: '#2256b3' },
            red:  { border: '#dc3545', background: '#fdebec', text: '#b02a37' },
            green: { border: '#198754', background: '#e8f5e9', text: '#155724' },
            golden: { border: '#ffc107', background: '#fff8e1', text: '#b08d00' } // Darker gold text
        }
    }
};
