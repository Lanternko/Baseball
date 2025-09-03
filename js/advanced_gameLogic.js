// Advanced Game Logic with Baseball_algo Integration
// This file contains the upgraded simulation functions

// 🔥 ADVANCED SIMULATION ENGINE using Baseball_algo models
function simulateAtBat(batter, pitcher) {
    // Handle pitcher stamina and effectiveness
    const staminaPercentage = pitcher.currentStamina > 0 ? (pitcher.currentStamina / pitcher.maxStamina) : 0;
    let pitcherEffectiveness = 1.0;
    
    if (staminaPercentage < 0.32) {
        pitcherEffectiveness = 0.7; // Significant penalty
    } else if (staminaPercentage < 0.50) {
        pitcherEffectiveness = 0.85; // Moderate penalty
    }
    
    // Drain pitcher stamina
    const staminaDrain = Math.floor(Math.random() * 
        (4.5 - 2.5 + 1)) + 2.5; // CONFIG.stamina values
    pitcher.currentStamina = Math.max(0, pitcher.currentStamina - staminaDrain);
    
    // Get batter attributes - convert from old system to POW/HIT/EYE
    const batterPOW = Math.max(1, batter.power || 50);
    const batterHIT = Math.max(1, batter.hitRate || 50); 
    const batterEYE = Math.max(1, batter.contact || 50); // Using contact as EYE proxy
    
    // Apply pitcher effectiveness to batter attributes (pitcher dominance)
    const effectivePOW = Math.max(1, batterPOW * pitcherEffectiveness);
    const effectiveHIT = Math.max(1, batterHIT * pitcherEffectiveness);
    const effectiveEYE = Math.max(1, batterEYE * pitcherEffectiveness);
    
    // Use advanced simulation engine from Baseball_algo
    let atBatResult;
    if (typeof window !== 'undefined' && typeof window.simulateSimpleAtBat === 'function') {
        // Use the sophisticated probability model
        atBatResult = window.simulateSimpleAtBat(
            effectiveEYE, effectiveHIT, effectivePOW,
            Math.random(), Math.random(), Math.random(), Math.random()
        );
    } else {
        // Fallback to basic simulation if advanced models not loaded
        console.warn('Advanced simulation models not loaded, using basic fallback');
        atBatResult = simulateBasicAtBat(batter, pitcher, pitcherEffectiveness);
    }
    
    // Convert advanced simulation result to game outcome format
    let outcome = convertSimResultToOutcome(atBatResult, batter, pitcher);
    
    // Apply speed-based modifications for hits
    if (outcome.event === "SINGLE" && batter.speed) {
        const speedConfig = {
            stretchSingleToDoubleFast: 0.30,
            stretchSingleToDoubleMedium: 0.15
        };
        
        if (batter.speed > 7 && Math.random() < speedConfig.stretchSingleToDoubleFast) {
            outcome.event = "DOUBLE";
            outcome.basesAdvanced = 2;
            outcome.description = outcome.description.replace("SINGLE", "DOUBLE");
        } else if (batter.speed > 5 && Math.random() < speedConfig.stretchSingleToDoubleMedium) {
            outcome.event = "DOUBLE";
            outcome.basesAdvanced = 2;
            outcome.description = outcome.description.replace("SINGLE", "DOUBLE");
        }
    }
    
    return outcome;
}

// Fallback basic simulation if advanced models not available
function simulateBasicAtBat(batter, pitcher, effectiveness) {
    const random = Math.random();
    
    // Basic probability thresholds adjusted by pitcher effectiveness
    const strikeoutRate = 0.23 * (2 - effectiveness); // Higher when pitcher effective
    const walkRate = 0.08 * effectiveness; // Lower when pitcher effective  
    const homerunRate = 0.04 * effectiveness;
    const hitRate = 0.27 * effectiveness;
    
    if (random < strikeoutRate) return 'K';
    if (random < strikeoutRate + walkRate) return 'BB';
    if (random < strikeoutRate + walkRate + homerunRate) return 'HR';
    if (random < strikeoutRate + walkRate + homerunRate + hitRate) {
        return Math.random() < 0.25 ? '2B' : '1B';
    }
    return 'OUT';
}

// Convert advanced simulation results to game outcome format
function convertSimResultToOutcome(simResult, batter, pitcher) {
    const eventMap = {
        'K': {
            event: 'STRIKEOUT',
            description: `${batter.name} STRIKES OUT!  `,
            basesAdvanced: 0
        },
        'BB': {
            event: 'WALK', 
            description: `${batter.name} draws a WALK.  `,
            basesAdvanced: 1
        },
        'HR': {
            event: 'HOMERUN',
            description: `HOME RUN for ${batter.name}!!  `,
            basesAdvanced: 4
        },
        '2B': {
            event: 'DOUBLE',
            description: `${batter.name} hits a DOUBLE!  `,
            basesAdvanced: 2
        },
        '1B': {
            event: 'SINGLE', 
            description: `${batter.name} hits a SINGLE!  `,
            basesAdvanced: 1
        },
        'OUT': {
            event: 'OUT',
            description: `${batter.name} ${getRandomOutType()}.  `,
            basesAdvanced: 0
        }
    };
    
    const outcomeTemplate = eventMap[simResult] || eventMap['OUT'];
    
    return {
        event: outcomeTemplate.event,
        description: outcomeTemplate.description,
        basesAdvanced: outcomeTemplate.basesAdvanced,
        batter: batter,
        pitcher: pitcher
    };
}

function getRandomOutType() {
    const outTypes = ["Grounds Out", "Flies Out", "Lines Out", "Pops Up"];
    return outTypes[Math.floor(Math.random() * outTypes.length)];
}

// Export functions for use
if (typeof window !== 'undefined') {
    window.advancedSimulateAtBat = simulateAtBat;
    window.simulateBasicAtBat = simulateBasicAtBat;
    window.convertSimResultToOutcome = convertSimResultToOutcome;
}