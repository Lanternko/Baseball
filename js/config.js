// js/config.js
export const CONFIG = {
    innings: 9, // Changed from 3 to 9
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
            power: 3.0,
            velocity: 3.0,
            control: 2.5,
            technique: 1.5,
            staminaEffect: 2.0,
            scale: 1,
            base: 25
        }
    },
    statNormalization: {
        pitcherPowerEffectOnSO: 0.027,    // UPDATED from 0.03
        velocityEffectOnSO: 0.02,        // UPDATED from 0.025 (球速 ↑ → 三振 ↑)
        velocityEffectOnHit: -0.014,      // UPDATED from -0.02  (球速 ↑ → 安打 ↓)
        techniqueEffectOnHR: -0.015,      // (技巧 ↑ → 全壘打 ↓) - Unchanged for now
        techniqueEffectOnSO: 0.008,        // (技巧 ↑ → 三振微升) - Unchanged for now
        batterContactEffectOnSO: -0.027,  // (打擊率 ↑ → 三振 ↓) - This was your recent update, keeping it
        pitcherControlEffectOnWalk: -0.022, // Unchanged for now
        batterPowerEffectOnHR: 0.0099,     // Unchanged for now
        pitcherPowerEffectOnHR: -0.0023,  // UPDATED from -0.003 (Optional, very slight nerf)
        batterHitRateEffectOnHit: 0.040,  // Unchanged for now
        pitcherPowerEffectOnHit: -0.015   // UPDATED from -0.02
    },
    probabilityCaps: {
        strikeout: { min: 0.05, max: 0.50 },
        walk: { min: 0.02, max: 0.30 },
        homeRun: { min: 0.005, max: 0.10 },
        otherHit: { min: 0.05, max: 0.40 },
        outMin: 0.10,
        sumOfDeterminedRatesCap: 0.95
    },
    statColors: {
        low: 3,    // 1-3: Gray
        medium: 6, // 4-6: Green
        high: 8,   // 7-8: Yellow
        elite: 10  // 9-10: Red
        // CSS classes will be stat-low, stat-medium, stat-high, stat-elite
    }
};
