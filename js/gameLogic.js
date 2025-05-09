// js/gameLogic.js
import { CONFIG } from './config.js';
import { saveData, loadData, TEAM_RECORDS_KEY, PLAYER_STATS_KEY } from './storageUtils.js';
import { updateOutcomeText, triggerScoreFlash } from './ui.js';

let gameState = {
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

export function initializeGame(gameTeams) {
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
                batter.atBats = 0;
                batter.hits = 0;
                batter.runsBattedIn = 0;
                batter.gameHomeRuns = 0; // Reset game HR
                batter.atBatHistory = [];
                batter.performanceString = "0-0";
                // Career stats are not reset here
            });
        }
        if (gameTeams[teamKey].pitchers) {
            for (const pitcherRole in gameTeams[teamKey].pitchers) {
                const pitcher = gameTeams[teamKey].pitchers[pitcherRole];
                if (pitcher) {
                    pitcher.currentStamina = pitcher.maxStamina;
                    pitcher.gameStrikeouts = 0; // Reset game SO
                    pitcher.gameOutsRecorded = 0;
                    pitcher.gameRunsAllowed = 0;
                    // Career stats are not reset here
                }
            }
        }
    }
    // Ensure active players are set from the potentially updated gameTeams
    gameState.activePitcher = gameTeams.home.pitchers.starter; // Default, will be updated if needed
    gameState.activeBatter = gameTeams.away.batters[gameTeams.away.currentBatterIndex]; // Default
    console.log("Game initialized:", getGameState());
}

function simulateAtBat(batter, pitcher) {
    // ... (rest of simulateAtBat function remains the same as your provided version)
    // Using your existing simulateAtBat logic.
    // Make sure it returns an outcome object like:
    // { event: "STRIKEOUT", description: "...", batter, pitcher }
    // { event: "HOMERUN", description: "...", batter, pitcher, basesAdvanced: 4 }
    // etc.

    // --- START: Copy of your simulateAtBat logic ---
    // (Assuming your existing simulateAtBat is here and works)
    let effectivePower = pitcher.power;
    let effectiveControl = pitcher.control;

    effectivePower   += (pitcher.velocity - 5) * 0.5;
    effectiveControl += (pitcher.velocity - 5) * 0.2;

    const staminaPercentage = pitcher.currentStamina > 0 ? (pitcher.currentStamina / pitcher.maxStamina) : 0;

    if (staminaPercentage < CONFIG.stamina.penaltyThreshold2) {
        effectivePower -= CONFIG.stamina.penaltyAmount2;
        effectiveControl -= CONFIG.stamina.penaltyAmount2;
    } else if (staminaPercentage < CONFIG.stamina.penaltyThreshold1) {
        effectivePower -= CONFIG.stamina.penaltyAmount1;
        effectiveControl -= CONFIG.stamina.penaltyAmount1;
    }
    effectivePower = Math.max(1, effectivePower);
    effectiveControl = Math.max(1, effectiveControl);

    const staminaDrain = Math.floor(Math.random() * (CONFIG.stamina.depletionPerBatterMax - CONFIG.stamina.depletionPerBatterMin + 1)) + CONFIG.stamina.depletionPerBatterMin;
    pitcher.currentStamina = Math.max(0, pitcher.currentStamina - staminaDrain);

    let adjRates = { ...CONFIG.baseProbabilities };

    adjRates.strikeout += (effectivePower - 5) * CONFIG.statNormalization.pitcherPowerEffectOnSO +
                          (pitcher.velocity - 5) * CONFIG.statNormalization.velocityEffectOnSO +
                          (pitcher.technique - 5) * CONFIG.statNormalization.techniqueEffectOnSO +
                          (batter.contact - 5) * CONFIG.statNormalization.batterContactEffectOnSO;
    adjRates.strikeout = Math.max(CONFIG.probabilityCaps.strikeout.min, Math.min(adjRates.strikeout, CONFIG.probabilityCaps.strikeout.max));

    adjRates.walk += ((5 - effectiveControl)) * Math.abs(CONFIG.statNormalization.pitcherControlEffectOnWalk);
    adjRates.walk = Math.max(CONFIG.probabilityCaps.walk.min, Math.min(adjRates.walk, CONFIG.probabilityCaps.walk.max));

    adjRates.homeRun += (batter.power - 5) * CONFIG.statNormalization.batterPowerEffectOnHR +
                        (effectivePower - 5) * CONFIG.statNormalization.pitcherPowerEffectOnHR +
                        (pitcher.technique - 5) * CONFIG.statNormalization.techniqueEffectOnHR;
    adjRates.homeRun = Math.max(CONFIG.probabilityCaps.homeRun.min, Math.min(adjRates.homeRun, CONFIG.probabilityCaps.homeRun.max));

    adjRates.otherHit += (batter.hitRate - 5) * CONFIG.statNormalization.batterHitRateEffectOnHit +
                         (effectivePower - 5) * CONFIG.statNormalization.pitcherPowerEffectOnHit +
                         (pitcher.velocity - 5) * CONFIG.statNormalization.velocityEffectOnHit;
    adjRates.otherHit = Math.max(CONFIG.probabilityCaps.otherHit.min, Math.min(adjRates.otherHit, CONFIG.probabilityCaps.otherHit.max));

    let sumOfDeterminedRates = adjRates.strikeout + adjRates.walk + adjRates.homeRun + adjRates.otherHit;
    if (sumOfDeterminedRates > CONFIG.probabilityCaps.sumOfDeterminedRatesCap) {
        const scaleDown = CONFIG.probabilityCaps.sumOfDeterminedRatesCap / sumOfDeterminedRates;
        adjRates.strikeout *= scaleDown;
        adjRates.walk *= scaleDown;
        adjRates.homeRun *= scaleDown;
        adjRates.otherHit *= scaleDown;
        sumOfDeterminedRates = CONFIG.probabilityCaps.sumOfDeterminedRatesCap;
    }

    adjRates.out = 1.0 - sumOfDeterminedRates;

    if (adjRates.out < CONFIG.probabilityCaps.outMin) {
        const deficit = CONFIG.probabilityCaps.outMin - adjRates.out;
        adjRates.out = CONFIG.probabilityCaps.outMin;
        const totalToReduceFrom = adjRates.strikeout + adjRates.walk + adjRates.homeRun + adjRates.otherHit;
        if (totalToReduceFrom > 0) {
            adjRates.strikeout -= deficit * (adjRates.strikeout / totalToReduceFrom);
            adjRates.walk      -= deficit * (adjRates.walk / totalToReduceFrom);
            adjRates.homeRun   -= deficit * (adjRates.homeRun / totalToReduceFrom);
            adjRates.otherHit  -= deficit * (adjRates.otherHit / totalToReduceFrom);
        }
    }
     const finalSum = adjRates.strikeout + adjRates.walk + adjRates.homeRun + adjRates.otherHit + adjRates.out;
     if (finalSum !== 1.0 && finalSum > 0) {
         const scale = 1.0 / finalSum;
         adjRates.strikeout *= scale;
         adjRates.walk      *= scale;
         adjRates.homeRun   *= scale;
         adjRates.otherHit  *= scale;
         adjRates.out       *= scale;
     } else if (finalSum === 0) {
         adjRates.out = 1.0;
     }

    const random = Math.random();
    let cumulativeProbability = 0;
    let outcome = {};

    cumulativeProbability += adjRates.strikeout;
    if (random < cumulativeProbability) { outcome = { event: "STRIKEOUT", description: `${batter.name} STRIKES OUT!  `, batter, pitcher }; }
    else { cumulativeProbability += adjRates.walk;
        if (random < cumulativeProbability) { outcome = { event: "WALK", description: `${batter.name} draws a WALK.  `, batter, pitcher, basesAdvanced: 1 }; }
        else { cumulativeProbability += adjRates.homeRun;
            if (random < cumulativeProbability) { outcome = { event: "HOMERUN", description: `HOME RUN for ${batter.name}!!  `, batter, pitcher, basesAdvanced: 4 }; }
            else { cumulativeProbability += adjRates.otherHit;
                if (random < cumulativeProbability) {
                    let hitType = "SINGLE"; let basesAdv = 1;
                    if (Math.random() < CONFIG.speed.baseHitIsDoubleChance) {
                        hitType = "DOUBLE"; basesAdv = 2;
                    }
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
    // --- END: Copy of your simulateAtBat logic ---
}


function processAtBatOutcome(atBatOutcome, gameTeams) {
    const battingTeamKey = gameState.halfInning === 'top' ? 'away' : 'home';
    const battingTeam = gameTeams[battingTeamKey];
    let outcomeString = atBatOutcome.description;
    let outcomeTypeForUI = atBatOutcome.event;
    let runsScoredThisPlay = 0;
    let isHit = false;
    let isAtBat = true;

    const batter = atBatOutcome.batter;
    const pitcher = atBatOutcome.pitcher; // Get pitcher from outcome
    let historyCode = "OUT";

    switch (atBatOutcome.event) {
        case "STRIKEOUT":
            historyCode = "K";
            if (pitcher) {
                pitcher.gameStrikeouts = (pitcher.gameStrikeouts || 0) + 1;
                pitcher.careerStrikeouts = (pitcher.careerStrikeouts || 0) + 1;
            }
            break;
        case "WALK":
            historyCode = "BB";
            isAtBat = false;
            break;
        case "SINGLE":
            historyCode = "1B";
            isHit = true;
            break;
        case "DOUBLE":
            historyCode = "2B";
            isHit = true;
            break;
        case "TRIPLE":
            historyCode = "3B";
            isHit = true;
            break;
        case "HOMERUN":
            historyCode = "HR";
            isHit = true;
            if (batter) {
                batter.gameHomeRuns = (batter.gameHomeRuns || 0) + 1;
                batter.careerHomeRuns = (batter.careerHomeRuns || 0) + 1;
            }
            break;
    }

    if (batter) {
        if (batter.atBatHistory) batter.atBatHistory.push(historyCode);
        if (isAtBat) {
            batter.atBats = (batter.atBats || 0) + 1;
            batter.careerAtBats = (batter.careerAtBats || 0) + 1;
        }
        if (isHit) {
            batter.hits = (batter.hits || 0) + 1;
            batter.careerHits = (batter.careerHits || 0) + 1;
        }
        // Update RBI if applicable (done during runner advancement)
        batter.performanceString = `${batter.hits}-${batter.atBats}`;
    }
    if (isHit) { battingTeam.totalHits = (battingTeam.totalHits || 0) + 1; }

    // Runner advancement and scoring logic (remains largely the same)
    if (atBatOutcome.event === "STRIKEOUT" || atBatOutcome.event === "OUT") {
        gameState.outs++;
        if (pitcher) { // Also record game out for pitcher
             pitcher.gameOutsRecorded = (pitcher.gameOutsRecorded || 0) + 1;
        }
    } else {
        const batterMoving = atBatOutcome.batter;
        const basesToAdvanceByHit = atBatOutcome.basesAdvanced;
        let newBases = [...gameState.bases];

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
                    if (batter) batter.runsBattedIn = (batter.runsBattedIn || 0) + 1; // RBI for batter
                    newBases[i] = null;
                } else {
                    newBases[targetBaseIndex] = runner;
                    newBases[i] = null;
                }
            }
        }

        if (basesToAdvanceByHit === 4) { // Homerun
            runsScoredThisPlay++;
            if (batter) batter.runsBattedIn = (batter.runsBattedIn || 0) + 1; // RBI for batter (self)
        } else if (atBatOutcome.event === "WALK") {
            if (newBases[0]) {
                if (newBases[1]) {
                    if (newBases[2]) {
                        runsScoredThisPlay++;
                        if (batter) batter.runsBattedIn = (batter.runsBattedIn || 0) + 1; // RBI for batter on bases-loaded walk
                    }
                    newBases[2] = newBases[1];
                }
                newBases[1] = newBases[0];
            }
            newBases[0] = batterMoving;
        } else {
             if (basesToAdvanceByHit > 0 && basesToAdvanceByHit <= 3) {
                newBases[basesToAdvanceByHit - 1] = batterMoving;
             }
        }
        gameState.bases = [...newBases];
    }

    // Pitcher career stats update
    if (pitcher) {
         if (atBatOutcome.event === "STRIKEOUT" || atBatOutcome.event === "OUT") {
             pitcher.careerOutsRecorded = (pitcher.careerOutsRecorded || 0) + 1;
         }
         if (runsScoredThisPlay > 0) {
             pitcher.careerRunsAllowed = (pitcher.careerRunsAllowed || 0) + runsScoredThisPlay;
             pitcher.gameRunsAllowed = (pitcher.gameRunsAllowed || 0) + runsScoredThisPlay; // Track game runs
         }
    }

    if (runsScoredThisPlay > 0) {
        const inningIndex = gameState.currentInning - 1;
        if (inningIndex >= 0 && inningIndex < CONFIG.innings) {
            battingTeam.scorePerInning[inningIndex] = (battingTeam.scorePerInning[inningIndex] || 0) + runsScoredThisPlay;
        }
        battingTeam.totalRuns += runsScoredThisPlay;
        outcomeString += ` (${runsScoredThisPlay} run${runsScoredThisPlay > 1 ? 's' : ''} scored!)`;
        triggerScoreFlash(runsScoredThisPlay);
    }

    updateOutcomeText(outcomeString, outcomeTypeForUI);
}

// changeHalfInning, endGame, playNextAtBat functions remain the same as your provided version
// Ensure they correctly use the updated gameTeams and gameState structures.
// --- START: Copy of your changeHalfInning ---
function changeHalfInning(gameTeams) {
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

    } else {
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
// --- END: Copy of your changeHalfInning ---

// --- START: Copy of your endGame ---
function endGame(gameTeams, customMessage = "") {
    if (gameState.gameOver) return;
    gameState.gameOver = true;
    let winnerKey = null;
    let loserKey = null;

    if (gameTeams.home.totalRuns > gameTeams.away.totalRuns) {
        winnerKey = 'home'; loserKey = 'away';
    } else if (gameTeams.away.totalRuns > gameTeams.home.totalRuns) {
        winnerKey = 'away'; loserKey = 'home';
    }

    let teamRecords = loadData(TEAM_RECORDS_KEY, {
         away: { name: gameTeams.away.name, wins: 0, losses: 0 },
         home: { name: gameTeams.home.name, wins: 0, losses: 0 }
    });

    if (winnerKey && loserKey) {
        teamRecords[winnerKey].wins++;
        teamRecords[loserKey].losses++;
    }

    saveData(TEAM_RECORDS_KEY, teamRecords);
    saveData(PLAYER_STATS_KEY, gameTeams); // Save updated player career stats

    let finalMessage = customMessage;
    if (!finalMessage) {
        if (gameTeams.home.totalRuns === gameTeams.away.totalRuns) {
             finalMessage = `It's a TIE after ${gameState.currentInning > CONFIG.innings ? gameState.currentInning -1 : CONFIG.innings} innings! ${gameTeams.home.totalRuns} - ${gameTeams.away.totalRuns}.`;
        } else if (winnerKey === 'home') {
            finalMessage = `${gameTeams.home.name} win ${gameTeams.home.totalRuns} - ${gameTeams.away.totalRuns}!`;
        } else if (winnerKey === 'away') {
            finalMessage = `${gameTeams.away.name} win ${gameTeams.away.totalRuns} - ${gameTeams.home.totalRuns}!`;
        } else {
             finalMessage = `Game Over. Score: ${gameTeams.away.name} ${gameTeams.away.totalRuns} - ${gameTeams.home.name} ${gameTeams.home.totalRuns}.`;
        }
    }
    updateOutcomeText(`GAME OVER! ${finalMessage}`, "GAME_OVER");
}
// --- END: Copy of your endGame ---

// --- START: Copy of your playNextAtBat ---
export function playNextAtBat(gameTeams) {
    if (gameState.gameOver || !gameState.gameStarted) return;

    const battingTeamKey = gameState.halfInning === 'top' ? 'away' : 'home';
    const battingTeam = gameTeams[battingTeamKey];
    const fieldingTeamKey = gameState.halfInning === 'top' ? 'home' : 'away';
    const fieldingTeam = gameTeams[fieldingTeamKey];

    if (!battingTeam || !battingTeam.batters || battingTeam.currentBatterIndex === undefined) { console.error("Invalid batting team"); return; }
    if (!fieldingTeam || !fieldingTeam.pitchers) { console.error("Invalid fielding team"); return; }

    gameState.activeBatter = battingTeam.batters[battingTeam.currentBatterIndex];
    if (!gameState.activeBatter) {
        console.error(`Batter not found at index ${battingTeam.currentBatterIndex} for ${battingTeamKey}`);
        battingTeam.currentBatterIndex = 0;
        gameState.activeBatter = battingTeam.batters[0];
        if (!gameState.activeBatter) {
            console.error("Critical error: Batter order empty or invalid after reset.");
            gameState.gameOver = true;
            updateOutcomeText("Critical Error: Invalid batter order. Game stopped.", "GAME_ERROR");
            return;
        }
    }

    const currentPitcher = gameState.activePitcher;
    let potentialNewPitcher = null;
    const pitcherStaminaPercent = currentPitcher.currentStamina / currentPitcher.maxStamina;
    const closerMinInning = Math.max(1, CONFIG.innings - 1);

    if (pitcherStaminaPercent < CONFIG.stamina.penaltyThreshold2 && currentPitcher.role !== "Closer") {
    if (currentPitcher.currentStamina < 30 && currentPitcher.role !== "Closer") {
         if (gameState.currentInning >= closerMinInning && fieldingTeam.pitchers.closer) { potentialNewPitcher = fieldingTeam.pitchers.closer; }
         else if (fieldingTeam.pitchers.reliever) { potentialNewPitcher = fieldingTeam.pitchers.reliever; }
    } else if (pitcherStaminaPercent < CONFIG.stamina.penaltyThreshold1 && currentPitcher.role === "Starter" && gameState.currentInning > 3) {
        if (fieldingTeam.pitchers.reliever) { potentialNewPitcher = fieldingTeam.pitchers.reliever; }
    }

    if (potentialNewPitcher && potentialNewPitcher !== currentPitcher) {
         if (potentialNewPitcher.currentStamina > CONFIG.stamina.penaltyThreshold2 * potentialNewPitcher.maxStamina * 0.5) {
            gameState.activePitcher = potentialNewPitcher;
            updateOutcomeText(`${fieldingTeam.name} brings in ${potentialNewPitcher.role.toLowerCase()} ${potentialNewPitcher.name}.`, "GAME_EVENT");
         }
    }

    const atBatResult = simulateAtBat(gameState.activeBatter, gameState.activePitcher);
    processAtBatOutcome(atBatResult, gameTeams); // This now updates HR and SO

    if (!gameState.gameOver) {
        battingTeam.currentBatterIndex = (battingTeam.currentBatterIndex + 1) % 9;
        if (gameState.outs >= 3) {
            if (gameState.halfInning === 'bottom' && gameState.currentInning >= CONFIG.innings && gameTeams.home.totalRuns > gameTeams.away.totalRuns) {
                endGame(gameTeams, `${gameTeams.home.name} walk it off with a score of ${gameTeams.home.totalRuns} - ${gameTeams.away.totalRuns}!`);
            } else {
                changeHalfInning(gameTeams);
                if (!gameState.gameOver) {
                    const newBattingTeamKey = gameState.halfInning === 'top' ? 'away' : 'home';
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
// --- END: Copy of your playNextAtBat ---
