// js/gameLogic.js
import { CONFIG } from './config.js';
// Import triggerScoreFlash from ui.js
import { updateOutcomeText, triggerScoreFlash } from './ui.js';

let gameState = { /* ... same state variables ... */
    currentInning: 1,
    halfInning: "top",
    outs: 0,
    bases: [null, null, null],
    activePitcher: null,
    activeBatter: null,
    gameStarted: false,
    gameOver: false,
};

export function getGameState() { return { ...gameState }; }

export function initializeGame(gameTeams) { /* ... same as before ... */
    gameState.currentInning = 1;
    gameState.halfInning = "top";
    gameState.outs = 0;
    gameState.bases = [null, null, null];
    gameState.gameStarted = true;
    gameState.gameOver = false;

    for (const teamKey in gameTeams) {
        gameTeams[teamKey].scorePerInning = Array(CONFIG.innings).fill(0);
        gameTeams[teamKey].totalRuns = 0;
        gameTeams[teamKey].totalHits = 0;
        gameTeams[teamKey].totalErrors = 0;
        gameTeams[teamKey].currentBatterIndex = 0;
        if (gameTeams[teamKey].batters) {
            gameTeams[teamKey].batters.forEach(batter => {
                batter.atBats = 0; batter.hits = 0; batter.runsBattedIn = 0;
                batter.atBatHistory = []; batter.performanceString = "0-0";
            });
        }
        if (gameTeams[teamKey].pitchers) {
            for (const pitcherRole in gameTeams[teamKey].pitchers) {
                const pitcher = gameTeams[teamKey].pitchers[pitcherRole];
                if (pitcher) {
                    pitcher.currentStamina = pitcher.maxStamina;
                    pitcher.teamKeyOriginal = teamKey;
                }
            }
        }
    }
    gameState.activePitcher = gameTeams.home.pitchers.starter;
    gameState.activeBatter = gameTeams.away.batters[gameTeams.away.currentBatterIndex];
    console.log("Game Initialized:", getGameState());
}

// simulateAtBat remains the same (using pitcher.power)
function simulateAtBat(batter, pitcher) { /* ... same logic using pitcher.power ... */
    let effectivePower = pitcher.power; // Use power
    let effectiveControl = pitcher.control;
    // 球速影響：提升壓制力、略增控球
    effectivePower   += (pitcher.velocity - 5) * 0.5;
    effectiveControl += (pitcher.velocity - 5) * 0.2;
    
    const staminaPercentage = pitcher.currentStamina > 0 ? (pitcher.currentStamina / pitcher.maxStamina) : 0;

    // Apply stamina penalties
    if (staminaPercentage < CONFIG.stamina.penaltyThreshold2) {
        effectivePower -= CONFIG.stamina.penaltyAmount2;
        effectiveControl -= CONFIG.stamina.penaltyAmount2;
    } else if (staminaPercentage < CONFIG.stamina.penaltyThreshold1) {
        effectivePower -= CONFIG.stamina.penaltyAmount1;
        effectiveControl -= CONFIG.stamina.penaltyAmount1;
    }
    effectivePower = Math.max(1, effectivePower);
    effectiveControl = Math.max(1, effectiveControl);

    // Reduce stamina
    const staminaDrain = Math.floor(Math.random() * (CONFIG.stamina.depletionPerBatterMax - CONFIG.stamina.depletionPerBatterMin + 1)) + CONFIG.stamina.depletionPerBatterMin;
    pitcher.currentStamina = Math.max(0, pitcher.currentStamina - staminaDrain);

    // Probability Calculations using effectivePower/Control
    let adjRates = { ...CONFIG.baseProbabilities };
    adjRates.strikeout += (effectivePower - 5) * CONFIG.statNormalization.pitcherPowerEffectOnSO + (pitcher.velocity - 5) * CONFIG.statNormalization.velocityEffectOnSO
    +                      + (pitcher.technique - 5) * CONFIG.statNormalization.techniqueEffectOnSO + (batter.contact - 5) * CONFIG.statNormalization.batterContactEffectOnSO;
    adjRates.strikeout = Math.max(CONFIG.probabilityCaps.strikeout.min, Math.min(adjRates.strikeout, CONFIG.probabilityCaps.strikeout.max));
    adjRates.walk += ((5 - effectiveControl)) * Math.abs(CONFIG.statNormalization.pitcherControlEffectOnWalk);
    adjRates.walk = Math.max(CONFIG.probabilityCaps.walk.min, Math.min(adjRates.walk, CONFIG.probabilityCaps.walk.max));
    adjRates.homeRun += (batter.power - 5) * CONFIG.statNormalization.batterPowerEffectOnHR + (effectivePower - 5) * CONFIG.statNormalization.pitcherPowerEffectOnHR + (pitcher.technique - 5) * CONFIG.statNormalization.techniqueEffectOnHR;;
    adjRates.homeRun = Math.max(CONFIG.probabilityCaps.homeRun.min, Math.min(adjRates.homeRun, CONFIG.probabilityCaps.homeRun.max));
    adjRates.otherHit += (batter.hitRate - 5) * CONFIG.statNormalization.batterHitRateEffectOnHit + (effectivePower - 5) * CONFIG.statNormalization.pitcherPowerEffectOnHit + (pitcher.velocity - 5) * CONFIG.statNormalization.velocityEffectOnHit;
    ;
    adjRates.otherHit = Math.max(CONFIG.probabilityCaps.otherHit.min, Math.min(adjRates.otherHit, CONFIG.probabilityCaps.otherHit.max));

    // --- Normalization and Dice Roll ---
    let sumOfDeterminedRates = adjRates.strikeout + adjRates.walk + adjRates.homeRun + adjRates.otherHit;
    if (sumOfDeterminedRates > CONFIG.probabilityCaps.sumOfDeterminedRatesCap) {
        const scaleDown = CONFIG.probabilityCaps.sumOfDeterminedRatesCap / sumOfDeterminedRates;
        adjRates.strikeout *= scaleDown; adjRates.walk *= scaleDown; adjRates.homeRun *= scaleDown; adjRates.otherHit *= scaleDown;
        sumOfDeterminedRates = CONFIG.probabilityCaps.sumOfDeterminedRatesCap;
    }
    adjRates.out = 1.0 - sumOfDeterminedRates;
    if (adjRates.out < CONFIG.probabilityCaps.outMin) {
        const deficit = CONFIG.probabilityCaps.outMin - adjRates.out;
        adjRates.out = CONFIG.probabilityCaps.outMin;
        const totalToReduceFrom = adjRates.strikeout + adjRates.walk + adjRates.homeRun + adjRates.otherHit;
        if (totalToReduceFrom > 0) {
            adjRates.strikeout -= deficit * (adjRates.strikeout / totalToReduceFrom);
            adjRates.walk -= deficit * (adjRates.walk / totalToReduceFrom);
            adjRates.homeRun -= deficit * (adjRates.homeRun / totalToReduceFrom);
            adjRates.otherHit -= deficit * (adjRates.otherHit / totalToReduceFrom);
        }
    }
     const finalSum = adjRates.strikeout + adjRates.walk + adjRates.homeRun + adjRates.otherHit + adjRates.out;
     if (finalSum !== 1.0 && finalSum > 0) {
         const scale = 1.0 / finalSum;
         adjRates.strikeout *= scale; adjRates.walk *= scale; adjRates.homeRun *= scale; adjRates.otherHit *= scale; adjRates.out *= scale;
     } else if (finalSum === 0) { adjRates.out = 1.0; }

    const random = Math.random();
    let cumulativeProbability = 0;
    let outcome = {};
    // Determine outcome
    cumulativeProbability += adjRates.strikeout;
    if (random < cumulativeProbability) { outcome = { event: "STRIKEOUT", description: `${batter.name} STRIKES OUT!  `, batter, pitcher }; }
    else { cumulativeProbability += adjRates.walk;
        if (random < cumulativeProbability) { outcome = { event: "WALK", description: `${batter.name} draws a WALK.  `, batter, pitcher, basesAdvanced: 1 }; }
        else { cumulativeProbability += adjRates.homeRun;
            if (random < cumulativeProbability) { outcome = { event: "HOMERUN", description: `HOME RUN for ${batter.name}!!  `, batter, pitcher, basesAdvanced: 4 }; }
            else { cumulativeProbability += adjRates.otherHit;
                if (random < cumulativeProbability) {
                    let hitType = "SINGLE"; let basesAdv = 1;
                    if (Math.random() < CONFIG.speed.baseHitIsDoubleChance) { hitType = "DOUBLE"; basesAdv = 2; }
                    if (hitType === "SINGLE" && batter.speed > 7 && Math.random() < CONFIG.speed.stretchSingleToDoubleFast) { hitType = "DOUBLE"; basesAdv = 2; }
                    else if (hitType === "SINGLE" && batter.speed > 5 && Math.random() < CONFIG.speed.stretchSingleToDoubleMedium) { hitType = "DOUBLE"; basesAdv = 2; }
                    outcome = { event: hitType, description: `${batter.name} hits a ${hitType}!  `, batter, pitcher, basesAdvanced: basesAdv };
                } else {
                    const outTypes = ["Grounds Out", "Flies Out", "Lines Out", "Pops Up"];
                    const randomOutDesc = outTypes[Math.floor(Math.random() * outTypes.length)];
                    outcome = { event: "OUT", description: `${batter.name} ${randomOutDesc}.  `, batter, pitcher };
                }
            }
        }
    }
    return outcome;
}


function processAtBatOutcome(atBatOutcome, gameTeams) {
    const battingTeamKey = gameState.halfInning === 'top' ? 'away' : 'home';
    const battingTeam = gameTeams[battingTeamKey];
    let outcomeString = atBatOutcome.description;
    let outcomeTypeForUI = atBatOutcome.event;
    let runsScoredThisPlay = 0;
    let isHit = false;
    let isAtBat = true;

    // Record History & Update Stats
    const batter = atBatOutcome.batter;
    let historyCode = "OUT";
    switch (atBatOutcome.event) {
        case "STRIKEOUT": historyCode = "K"; break;
        case "WALK": historyCode = "BB"; isAtBat = false; break;
        case "SINGLE": historyCode = "1B"; isHit = true; break;
        case "DOUBLE": historyCode = "2B"; isHit = true; break;
        case "TRIPLE": historyCode = "3B"; isHit = true; break;
        case "HOMERUN": historyCode = "HR"; isHit = true; break;
    }
    if (batter) {
        if (batter.atBatHistory) batter.atBatHistory.push(historyCode);
        if (isAtBat) batter.atBats = (batter.atBats || 0) + 1;
        if (isHit) batter.hits = (batter.hits || 0) + 1;
        batter.performanceString = `${batter.hits}-${batter.atBats}`;
    }
    if (isHit) { battingTeam.totalHits = (battingTeam.totalHits || 0) + 1; }

    // Base running and scoring logic
    if (atBatOutcome.event === "STRIKEOUT" || atBatOutcome.event === "OUT") {
        gameState.outs++;
    } else {
        const batterMoving = atBatOutcome.batter;
        const basesToAdvanceByHit = atBatOutcome.basesAdvanced;
        let newBases = [...gameState.bases];
        // Advance existing runners
        for (let i = 2; i >= 0; i--) {
            if (newBases[i]) {
                const runner = newBases[i];
                let runnerSpecificAdvance = basesToAdvanceByHit;
                if (basesToAdvanceByHit === 1 || basesToAdvanceByHit === 2) {
                    if (runner.speed > 7 && Math.random() < CONFIG.speed.runnerExtraBaseFast) runnerSpecificAdvance++;
                    else if (runner.speed > 5 && Math.random() < CONFIG.speed.runnerExtraBaseMedium) runnerSpecificAdvance++;
                }
                const targetBaseIndex = i + runnerSpecificAdvance;
                if (targetBaseIndex >= 3) {
                    runsScoredThisPlay++;
                    if (batter) batter.runsBattedIn = (batter.runsBattedIn || 0) + 1;
                    newBases[i] = null;
                } else {
                    newBases[targetBaseIndex] = runner; newBases[i] = null;
                }
            }
        }
        // Place batter / Handle Force plays
        if (basesToAdvanceByHit === 4) {
            runsScoredThisPlay++;
            if (batter) batter.runsBattedIn = (batter.runsBattedIn || 0) + 1;
        } else if (atBatOutcome.event === "WALK") {
            if (newBases[0]) { if (newBases[1]) { if (newBases[2]) { runsScoredThisPlay++; if (batter) batter.runsBattedIn = (batter.runsBattedIn || 0) + 1; } newBases[2] = newBases[1]; } newBases[1] = newBases[0]; }
            newBases[0] = batterMoving;
        } else {
             if (basesToAdvanceByHit > 0 && basesToAdvanceByHit <= 3) { newBases[basesToAdvanceByHit - 1] = batterMoving; }
        }
        gameState.bases = [...newBases];
    }

    // Update Scores
    if (runsScoredThisPlay > 0) {
        const inningIndex = gameState.currentInning - 1;
        if (inningIndex >= 0 && inningIndex < CONFIG.innings) { battingTeam.scorePerInning[inningIndex] = (battingTeam.scorePerInning[inningIndex] || 0) + runsScoredThisPlay; }
        battingTeam.totalRuns += runsScoredThisPlay;
        outcomeString += ` (${runsScoredThisPlay} run${runsScoredThisPlay > 1 ? 's' : ''} scored!)`;
        // UI #5: Trigger score flash effect
        triggerScoreFlash(runsScoredThisPlay);
    }

    updateOutcomeText(outcomeString, outcomeTypeForUI);
}


// changeHalfInning remains the same
function changeHalfInning(gameTeams) { /* ... same logic ... */
     const teamThatBattedKey = gameState.halfInning === 'top' ? 'away' : 'home';
    const teamThatBatted = gameTeams[teamThatBattedKey];
    const inningIndex = gameState.currentInning - 1;

    if (inningIndex >= 0 && inningIndex < CONFIG.innings) {
        teamThatBatted.scorePerInning[inningIndex] = teamThatBatted.scorePerInning[inningIndex] || 0;
    }

    gameState.outs = 0;
    gameState.bases = [null, null, null];
    updateOutcomeText("Change Side.", "GAME_EVENT");

    if (gameState.halfInning === "top") {
        gameState.halfInning = "bottom";
        const fieldingTeam = gameTeams.away;
        gameState.activePitcher = fieldingTeam.pitchers.starter;
        if (gameState.currentInning > 3 && gameState.activePitcher.currentStamina < CONFIG.stamina.penaltyThreshold1 * gameState.activePitcher.maxStamina) {
             gameState.activePitcher = fieldingTeam.pitchers.reliever || fieldingTeam.pitchers.starter;
        }
        gameState.activeBatter = gameTeams.home.batters[gameTeams.home.currentBatterIndex];

        if (gameState.currentInning === CONFIG.innings && gameTeams.home.totalRuns > gameTeams.away.totalRuns) {
            endGame(gameTeams, `${gameTeams.home.name} win! No need for bottom of the ${CONFIG.innings}th.`);
            return;
        }

    } else { // End of bottom half
        gameState.halfInning = "top";
        gameState.currentInning++;
        if (gameState.currentInning > CONFIG.innings) {
            endGame(gameTeams);
            return;
        }
        const fieldingTeam = gameTeams.home;
        gameState.activePitcher = fieldingTeam.pitchers.starter;
         if (gameState.currentInning > 3 && gameState.activePitcher.currentStamina < CONFIG.stamina.penaltyThreshold1 * gameState.activePitcher.maxStamina) {
            gameState.activePitcher = fieldingTeam.pitchers.reliever || fieldingTeam.pitchers.starter;
        }
        gameState.activeBatter = gameTeams.away.batters[gameTeams.away.currentBatterIndex];
    }
}

// endGame remains the same
function endGame(gameTeams, customMessage = "") { /* ... same logic ... */
    gameState.gameOver = true;
    let finalMessage = customMessage;
    if (!finalMessage) {
        if (gameState.currentInning > CONFIG.innings && gameTeams.home.totalRuns === gameTeams.away.totalRuns) {
             finalMessage = `It's a TIE after ${CONFIG.innings} innings! ${gameTeams.home.totalRuns} - ${gameTeams.away.totalRuns}.`;
        } else if (gameTeams.home.totalRuns > gameTeams.away.totalRuns) {
            finalMessage = `${gameTeams.home.name} win ${gameTeams.home.totalRuns} - ${gameTeams.away.totalRuns}!`;
        } else if (gameTeams.away.totalRuns > gameTeams.home.totalRuns) {
            finalMessage = `${gameTeams.away.name} win ${gameTeams.away.totalRuns} - ${gameTeams.home.totalRuns}!`;
        } else {
             finalMessage = `It's a TIE after ${CONFIG.innings} innings! ${gameTeams.home.totalRuns} - ${gameTeams.away.totalRuns}.`;
        }
    }
    updateOutcomeText(`GAME OVER! ${finalMessage}`, "GAME_OVER");
}

// playNextAtBat remains the same
export function playNextAtBat(gameTeams) { /* ... same logic ... */
    if (gameState.gameOver || !gameState.gameStarted) return;

    const battingTeamKey = gameState.halfInning === 'top' ? 'away' : 'home';
    const battingTeam = gameTeams[battingTeamKey];
    const fieldingTeamKey = gameState.halfInning === 'top' ? 'home' : 'away';
    const fieldingTeam = gameTeams[fieldingTeamKey];

    if (!battingTeam || !battingTeam.batters || battingTeam.currentBatterIndex === undefined) { console.error("Batting team invalid"); return; }
    if (!fieldingTeam || !fieldingTeam.pitchers) { console.error("Fielding team invalid"); return; }

    gameState.activeBatter = battingTeam.batters[battingTeam.currentBatterIndex];
    if (!gameState.activeBatter) {
        console.error(`Batter not found at index ${battingTeam.currentBatterIndex}`);
        battingTeam.currentBatterIndex = 0; // Reset index
        gameState.activeBatter = battingTeam.batters[0];
        if (!gameState.activeBatter) return;
    }

    // Pitcher Selection/Change Logic
    const currentPitcher = gameState.activePitcher;
    let potentialNewPitcher = null;
    const pitcherStaminaPercent = currentPitcher.currentStamina / currentPitcher.maxStamina;
    const closerMinInning = Math.max(1, CONFIG.innings - 1);

    if (pitcherStaminaPercent < CONFIG.stamina.penaltyThreshold2 && currentPitcher.role !== "Closer") {
         if (gameState.currentInning >= closerMinInning && fieldingTeam.pitchers.closer) { potentialNewPitcher = fieldingTeam.pitchers.closer; }
         else if (fieldingTeam.pitchers.reliever) { potentialNewPitcher = fieldingTeam.pitchers.reliever; }
    } else if (pitcherStaminaPercent < CONFIG.stamina.penaltyThreshold1 && currentPitcher.role === "Starter" && gameState.currentInning > 3) {
        if (fieldingTeam.pitchers.reliever) { potentialNewPitcher = fieldingTeam.pitchers.reliever; }
    }

    if (potentialNewPitcher && potentialNewPitcher !== currentPitcher) {
         if (potentialNewPitcher.currentStamina > CONFIG.stamina.penaltyThreshold2 * potentialNewPitcher.maxStamina * 1.5) {
            gameState.activePitcher = potentialNewPitcher;
            updateOutcomeText(`${fieldingTeam.name} brings in ${potentialNewPitcher.role.toLowerCase()} ${potentialNewPitcher.name}.`, "GAME_EVENT");
         }
    }

    const atBatResult = simulateAtBat(gameState.activeBatter, gameState.activePitcher);
    processAtBatOutcome(atBatResult, gameTeams);

    if (!gameState.gameOver) {
        battingTeam.currentBatterIndex = (battingTeam.currentBatterIndex + 1) % 9;
        if (gameState.outs >= 3) {
            if (gameState.halfInning === 'bottom' && gameState.currentInning >= CONFIG.innings && gameTeams.home.totalRuns > gameTeams.away.totalRuns) {
                endGame(gameTeams, `${gameTeams.home.name} walk it off with a score of ${gameTeams.home.totalRuns} - ${gameTeams.away.totalRuns}!`);
            } else {
                changeHalfInning(gameTeams);
                const newBattingTeamKey = gameState.halfInning === 'top' ? 'away' : 'home';
                if (!gameState.gameOver) {
                     gameState.activeBatter = gameTeams[newBattingTeamKey].batters[gameTeams[newBattingTeamKey].currentBatterIndex];
                }
            }
        } else {
             gameState.activeBatter = battingTeam.batters[battingTeam.currentBatterIndex];
        }
    }

    if (gameState.currentInning > CONFIG.innings && !gameState.gameOver) {
        endGame(gameTeams);
    }
}
