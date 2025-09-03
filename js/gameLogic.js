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
    // 新增：儲存當前比賽的先發投手，以便在 endGame 中正確記錄勝敗投 (如果需要)
    awayStartingPitcherThisGame: null,
    homeStartingPitcherThisGame: null,
};

export function getGameState() { return { ...gameState }; }

/**
 * 初始化一場新遊戲。
 * @param {object} gameTeams - 包含客隊和主隊數據的物件。
 * @param {number} awayStarterRotationIndex - 客隊先發投手在輪值中的索引。
 * @param {number} homeStarterRotationIndex - 主隊先發投手在輪值中的索引。
 */
export function initializeGame(gameTeams, awayStarterRotationIndex, homeStarterRotationIndex) {
    gameState.currentInning = 1;
    gameState.halfInning = "top";
    gameState.outs = 0;
    gameState.bases = [null, null, null];
    gameState.gameStarted = true;
    gameState.gameOver = false;

    // 重設球隊比賽數據
    for (const teamKey in gameTeams) {
        gameTeams[teamKey].scorePerInning = Array(CONFIG.innings).fill(0);
        gameTeams[teamKey].totalRuns = 0;
        gameTeams[teamKey].totalHits = 0;
        gameTeams[teamKey].totalErrors = 0; // 雖然目前沒用到，但保留
        gameTeams[teamKey].currentBatterIndex = 0;
        
        // 重設打者比賽數據
        if (gameTeams[teamKey].batters) {
            gameTeams[teamKey].batters.forEach(batter => {
                batter.atBats = 0;
                batter.hits = 0;
                batter.runsBattedIn = 0;
                batter.gameHomeRuns = 0;
                batter.atBatHistory = [];
                batter.performanceString = "0-0";
            });
        }
        // 重設所有投手比賽數據 (包括輪值中的和牛棚中的)
        if (gameTeams[teamKey].pitchers) {
            if (gameTeams[teamKey].pitchers.startersRotation) {
                gameTeams[teamKey].pitchers.startersRotation.forEach(pitcher => {
                    if (pitcher) {
                        pitcher.currentStamina = pitcher.maxStamina;
                        pitcher.gameStrikeouts = 0;
                        pitcher.gameOutsRecorded = 0;
                        pitcher.gameRunsAllowed = 0;
                    }
                });
            }
            ['reliever', 'closer'].forEach(role => {
                const pitcher = gameTeams[teamKey].pitchers[role];
                if (pitcher) {
                    pitcher.currentStamina = pitcher.maxStamina;
                    pitcher.gameStrikeouts = 0;
                    pitcher.gameOutsRecorded = 0;
                    pitcher.gameRunsAllowed = 0;
                }
            });
        }
    }

    // 根據輪值索引選擇先發投手
    const awayStarters = gameTeams.away.pitchers.startersRotation;
    const homeStarters = gameTeams.home.pitchers.startersRotation;

    gameState.awayStartingPitcherThisGame = awayStarters && awayStarters.length > 0 ? awayStarters[awayStarterRotationIndex % awayStarters.length] : null;
    gameState.homeStartingPitcherThisGame = homeStarters && homeStarters.length > 0 ? homeStarters[homeStarterRotationIndex % homeStarters.length] : null;
    
    // 初始 activePitcher (客隊進攻，主隊投球)
    gameState.activePitcher = gameState.homeStartingPitcherThisGame || gameTeams.home.pitchers.reliever || gameTeams.home.pitchers.closer; // 提供備援
    gameState.activeBatter = gameTeams.away.batters[gameTeams.away.currentBatterIndex];

    if (!gameState.activePitcher) {
        console.error("CRITICAL: No starting pitcher available for home team.");
        // 可以考慮拋出錯誤或設定一個預設的虛擬投手
    }
    if (!gameState.activeBatter) {
        console.error("CRITICAL: No starting batter available for away team.");
    }

    console.log(`Game initialized. Away Starter: ${gameState.awayStartingPitcherThisGame?.name}, Home Starter: ${gameState.homeStartingPitcherThisGame?.name}`);
}

// 🔥 ADVANCED SIMULATION ENGINE using Baseball_algo models
function simulateAtBat(batter, pitcher) {
    // Handle pitcher stamina and effectiveness
    const staminaPercentage = pitcher.currentStamina > 0 ? (pitcher.currentStamina / pitcher.maxStamina) : 0;
    let pitcherEffectiveness = 1.0;
    
    if (staminaPercentage < CONFIG.stamina.penaltyThreshold2) {
        pitcherEffectiveness = 0.7; // Significant penalty
    } else if (staminaPercentage < CONFIG.stamina.penaltyThreshold1) {
        pitcherEffectiveness = 0.85; // Moderate penalty
    }
    
    // Drain pitcher stamina
    const staminaDrain = Math.floor(Math.random() * 
        (CONFIG.stamina.depletionPerBatterMax - CONFIG.stamina.depletionPerBatterMin + 1)) + 
        CONFIG.stamina.depletionPerBatterMin;
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
        if (batter.speed > 7 && Math.random() < CONFIG.speed.stretchSingleToDoubleFast) {
            outcome.event = "DOUBLE";
            outcome.basesAdvanced = 2;
            outcome.description = outcome.description.replace("SINGLE", "DOUBLE");
        } else if (batter.speed > 5 && Math.random() < CONFIG.speed.stretchSingleToDoubleMedium) {
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

function processAtBatOutcome(atBatOutcome, gameTeams) {
    // ... (您的 processAtBatOutcome 邏輯保持不變，它已經在更新球員的 gameHomeRuns, gameStrikeouts 等比賽數據)
    const battingTeamKey = gameState.halfInning === 'top' ? 'away' : 'home';
    const battingTeam = gameTeams[battingTeamKey];
    let outcomeString = atBatOutcome.description;
    let outcomeTypeForUI = atBatOutcome.event;
    let runsScoredThisPlay = 0;
    let isHit = false;
    let isAtBat = true;
    const batter = atBatOutcome.batter;
    const pitcher = atBatOutcome.pitcher; 
    let historyCode = "OUT";

    switch (atBatOutcome.event) {
        case "STRIKEOUT":
            historyCode = "K";
            if (pitcher) pitcher.gameStrikeouts = (pitcher.gameStrikeouts || 0) + 1;
            break;
        case "WALK": historyCode = "BB"; isAtBat = false; break;
        case "SINGLE": historyCode = "1B"; isHit = true; break;
        case "DOUBLE": historyCode = "2B"; isHit = true; break;
        case "TRIPLE": historyCode = "3B"; isHit = true; break;
        case "HOMERUN":
            historyCode = "HR"; isHit = true;
            if (batter) batter.gameHomeRuns = (batter.gameHomeRuns || 0) + 1;
            break;
    }
    if (batter) {
        if (batter.atBatHistory) batter.atBatHistory.push(historyCode);
        if (isAtBat) batter.atBats = (batter.atBats || 0) + 1;
        if (isHit) batter.hits = (batter.hits || 0) + 1;
        batter.performanceString = `${batter.hits}-${batter.atBats}`;
    }
    if (isHit) battingTeam.totalHits = (battingTeam.totalHits || 0) + 1;
    if (atBatOutcome.event === "STRIKEOUT" || atBatOutcome.event === "OUT") {
        gameState.outs++;
        if (pitcher) pitcher.gameOutsRecorded = (pitcher.gameOutsRecorded || 0) + 1;
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
                    if (batter) batter.runsBattedIn = (batter.runsBattedIn || 0) + 1; 
                    newBases[i] = null;
                } else {
                    newBases[targetBaseIndex] = runner; newBases[i] = null;
                }
            }
        }
        if (basesToAdvanceByHit === 4) { 
            runsScoredThisPlay++; if (batter) batter.runsBattedIn = (batter.runsBattedIn || 0) + 1; 
        } else if (atBatOutcome.event === "WALK") {
            if (newBases[0]) {
                if (newBases[1]) {
                    if (newBases[2]) { runsScoredThisPlay++; if (batter) batter.runsBattedIn = (batter.runsBattedIn || 0) + 1; }
                    newBases[2] = newBases[1];
                }
                newBases[1] = newBases[0];
            }
            newBases[0] = batterMoving;
        } else {
             if (basesToAdvanceByHit > 0 && basesToAdvanceByHit <= 3) newBases[basesToAdvanceByHit - 1] = batterMoving;
        }
        gameState.bases = [...newBases];
    }
    if (pitcher) {
         if (atBatOutcome.event === "STRIKEOUT" || atBatOutcome.event === "OUT") pitcher.careerOutsRecorded = (pitcher.careerOutsRecorded || 0) + 1; // 生涯數據在這裡累加 (範例，應在 endGame 中處理)
         if (runsScoredThisPlay > 0) {
             pitcher.gameRunsAllowed = (pitcher.gameRunsAllowed || 0) + runsScoredThisPlay;
         }
    }
    if (runsScoredThisPlay > 0) {
        const inningIndex = gameState.currentInning - 1;
        if (inningIndex >= 0 && inningIndex < CONFIG.innings) battingTeam.scorePerInning[inningIndex] = (battingTeam.scorePerInning[inningIndex] || 0) + runsScoredThisPlay;
        battingTeam.totalRuns += runsScoredThisPlay;
        outcomeString += ` (${runsScoredThisPlay} run${runsScoredThisPlay > 1 ? 's' : ''} scored!)`;
        triggerScoreFlash(runsScoredThisPlay);
    }
    updateOutcomeText(outcomeString, outcomeTypeForUI);
}

export function changeHalfInning(gameTeams) {
    // ... (您的 changeHalfInning 邏輯基本保持不變，但 activePitcher 的選擇需要調整)
    const teamThatBattedKey = gameState.halfInning === 'top' ? 'away' : 'home';
    const teamThatBatted = gameTeams[teamThatBattedKey];
    const inningIndex = gameState.currentInning - 1;

    if (inningIndex >= 0 && inningIndex < CONFIG.innings) {
        teamThatBatted.scorePerInning[inningIndex] = teamThatBatted.scorePerInning[inningIndex] || 0;
    }
    gameState.outs = 0;
    gameState.bases = [null, null, null];
    updateOutcomeText("Change Side.", "GAME_EVENT");

    if (gameState.halfInning === "top") { // 客隊打完，換主隊打擊，客隊投球
        gameState.halfInning = "bottom";
        // 客隊投球，使用其本場比賽的先發投手 (如果還在場上) 或牛棚
        // 注意：這裡的 activePitcher 應該是基於客隊的投手，而不是主隊的先發
        gameState.activePitcher = gameState.awayStartingPitcherThisGame; // 假設先發還在
        // 這裡可以加入更複雜的投手更換邏輯，例如檢查 gameState.awayStartingPitcherThisGame 的體力
        // 如果體力不足，則從 gameTeams.away.pitchers.reliever 或 closer 中選擇
        if (!gameState.activePitcher || (gameState.activePitcher.currentStamina < 30 && gameState.activePitcher.role === 'Starter')) { // 簡化判斷
            gameState.activePitcher = gameTeams.away.pitchers.reliever || gameTeams.away.pitchers.closer || gameState.awayStartingPitcherThisGame; // 提供備援
        }

        gameState.activeBatter = gameTeams.home.batters[gameTeams.home.currentBatterIndex];
        if (gameState.currentInning >= CONFIG.innings && gameTeams.home.totalRuns > gameTeams.away.totalRuns && gameState.outs < 3) {
             // 如果是最後一局下半，主隊超前，則直接結束比賽 (再見分)
            endGame(gameTeams, `${gameTeams.home.name} win! Walk-off victory in the bottom of the ${gameState.currentInning}th.`);
            return;
        }
    } else { // 主隊打完，換客隊打擊，主隊投球 (進入下一局)
        gameState.halfInning = "top";
        gameState.currentInning++;
        if (gameState.currentInning > CONFIG.innings) {
            if (gameTeams.home.totalRuns !== gameTeams.away.totalRuns) { // 只有在非平手時才結束
                 endGame(gameTeams);
                 return;
            }
            // 如果平手，則進入延長賽 (目前未實作，所以會結束)
            // 若要實作延長賽，這裡不應直接 endGame，而是繼續比賽
             updateOutcomeText(`End of ${CONFIG.innings} innings. Score is tied ${gameTeams.away.totalRuns}-${gameTeams.home.totalRuns}. Entering extra innings!`, "GAME_EVENT");
             // 這裡可以不 return，讓 playNextAtBat 繼續
        }
         // 主隊投球，使用其本場比賽的先發投手 (如果還在場上) 或牛棚
        gameState.activePitcher = gameState.homeStartingPitcherThisGame;
        if (!gameState.activePitcher || (gameState.activePitcher.currentStamina < 30 && gameState.activePitcher.role === 'Starter')) {
            gameState.activePitcher = gameTeams.home.pitchers.reliever || gameTeams.home.pitchers.closer || gameState.homeStartingPitcherThisGame;
        }
        gameState.activeBatter = gameTeams.away.batters[gameTeams.away.currentBatterIndex];
    }
}


export function endGame(gameTeams, customMessage = "") {
    if (gameState.gameOver) return;
    gameState.gameOver = true;

    // 1. 更新球隊戰績和先發輪值索引
    let teamRecords = loadData(TEAM_RECORDS_KEY, {});
    const awayTeamId = gameTeams.away.id;
    const homeTeamId = gameTeams.home.id;

    if (!teamRecords[awayTeamId]) teamRecords[awayTeamId] = { name: gameTeams.away.name, wins: 0, losses: 0, starterIndex: 0 };
    if (!teamRecords[homeTeamId]) teamRecords[homeTeamId] = { name: gameTeams.home.name, wins: 0, losses: 0, starterIndex: 0 };
    
    teamRecords[awayTeamId].name = gameTeams.away.name; // 確保名稱是最新的
    teamRecords[homeTeamId].name = gameTeams.home.name;

    let winnerKey = null;
    let loserKey = null;
    let winningPitcher = null; // 追蹤勝投 (簡化邏輯)
    let losingPitcher = null;  // 追蹤敗投 (簡化邏輯)

    if (gameTeams.home.totalRuns > gameTeams.away.totalRuns) {
        winnerKey = homeTeamId; loserKey = awayTeamId;
        teamRecords[homeTeamId].wins = (teamRecords[homeTeamId].wins || 0) + 1;
        teamRecords[awayTeamId].losses = (teamRecords[awayTeamId].losses || 0) + 1;
        winningPitcher = gameState.homeStartingPitcherThisGame; // 簡化：主隊先發勝
        losingPitcher = gameState.awayStartingPitcherThisGame;  // 簡化：客隊先發敗
    } else if (gameTeams.away.totalRuns > gameTeams.home.totalRuns) {
        winnerKey = awayTeamId; loserKey = homeTeamId;
        teamRecords[awayTeamId].wins = (teamRecords[awayTeamId].wins || 0) + 1;
        teamRecords[homeTeamId].losses = (teamRecords[homeTeamId].losses || 0) + 1;
        winningPitcher = gameState.awayStartingPitcherThisGame;
        losingPitcher = gameState.homeStartingPitcherThisGame;
    }
    // 平手情況不記錄勝敗

    // 更新先發輪值索引
    const awayRotationSize = gameTeams.away.pitchers.startersRotation?.length || 1;
    const homeRotationSize = gameTeams.home.pitchers.startersRotation?.length || 1;
    teamRecords[awayTeamId].starterIndex = (teamRecords[awayTeamId].starterIndex + 1) % awayRotationSize;
    teamRecords[homeTeamId].starterIndex = (teamRecords[homeTeamId].starterIndex + 1) % homeRotationSize;
    
    saveData(TEAM_RECORDS_KEY, teamRecords);

    // 2. 更新球員生涯數據
    let allPlayerStats = loadData(PLAYER_STATS_KEY, {});

    function updatePlayerCareerStats(player, teamIdForStorage) {
        if (!player || !player.name) return; // 確保球員物件和名稱存在
        if (!allPlayerStats[teamIdForStorage]) allPlayerStats[teamIdForStorage] = { players: {} };
        if (!allPlayerStats[teamIdForStorage].players[player.name]) {
            allPlayerStats[teamIdForStorage].players[player.name] = {
                name: player.name,
                type: player.type,
                // 初始化生涯數據欄位
                careerAtBats: 0, careerHits: 0, careerHomeRuns: 0, careerRunsBattedIn: 0,
                careerOutsRecorded: 0, careerRunsAllowed: 0, careerStrikeouts: 0, careerWins: 0, careerLosses: 0
            };
        }
        let targetStats = allPlayerStats[teamIdForStorage].players[player.name];

        if (player.type === 'batter') {
            targetStats.careerAtBats = (targetStats.careerAtBats || 0) + (player.atBats || 0);
            targetStats.careerHits = (targetStats.careerHits || 0) + (player.hits || 0);
            targetStats.careerHomeRuns = (targetStats.careerHomeRuns || 0) + (player.gameHomeRuns || 0);
            targetStats.careerRunsBattedIn = (targetStats.careerRunsBattedIn || 0) + (player.runsBattedIn || 0);
        } else if (player.type === 'pitcher') {
            targetStats.careerOutsRecorded = (targetStats.careerOutsRecorded || 0) + (player.gameOutsRecorded || 0);
            targetStats.careerRunsAllowed = (targetStats.careerRunsAllowed || 0) + (player.gameRunsAllowed || 0);
            targetStats.careerStrikeouts = (targetStats.careerStrikeouts || 0) + (player.gameStrikeouts || 0);
            // 簡化的勝敗投記錄
            if (winningPitcher && player.name === winningPitcher.name && player.teamId === (winnerKey === homeTeamId ? homeTeamId : awayTeamId)) {
                targetStats.careerWins = (targetStats.careerWins || 0) + 1;
            }
            if (losingPitcher && player.name === losingPitcher.name && player.teamId === (loserKey === homeTeamId ? homeTeamId : awayTeamId)) {
                targetStats.careerLosses = (targetStats.careerLosses || 0) + 1;
            }
        }
    }

    [gameTeams.away, gameTeams.home].forEach(team => {
        const currentTeamId = team.id;
        team.batters.forEach(batter => updatePlayerCareerStats(batter, currentTeamId));
        if (team.pitchers) {
            team.pitchers.startersRotation?.forEach(pitcher => {
                if (pitcher && (pitcher.gameOutsRecorded > 0 || pitcher.gameStrikeouts > 0 || pitcher.gameRunsAllowed > 0)) { // 只更新有出場的投手
                    updatePlayerCareerStats(pitcher, currentTeamId);
                }
            });
            ['reliever', 'closer'].forEach(role => {
                const pitcher = team.pitchers[role];
                if (pitcher && (pitcher.gameOutsRecorded > 0 || pitcher.gameStrikeouts > 0 || pitcher.gameRunsAllowed > 0)) {
                    updatePlayerCareerStats(pitcher, currentTeamId);
                }
            });
        }
    });

    saveData(PLAYER_STATS_KEY, allPlayerStats);

    // 3. 顯示最終訊息
    let finalMessage = customMessage;
    if (!finalMessage) {
        if (gameTeams.home.totalRuns === gameTeams.away.totalRuns) {
             finalMessage = `It's a TIE after ${gameState.currentInning > CONFIG.innings ? gameState.currentInning -1 : CONFIG.innings} innings! ${gameTeams.home.totalRuns} - ${gameTeams.away.totalRuns}.`;
        } else if (winnerKey === homeTeamId) {
            finalMessage = `${gameTeams.home.name} win ${gameTeams.home.totalRuns} - ${gameTeams.away.totalRuns}!`;
        } else if (winnerKey === awayTeamId) {
            finalMessage = `${gameTeams.away.name} win ${gameTeams.away.totalRuns} - ${gameTeams.home.totalRuns}!`;
        } else {
             finalMessage = `Game Over. Score: ${gameTeams.away.name} ${gameTeams.away.totalRuns} - ${gameTeams.home.name} ${gameTeams.home.totalRuns}.`;
        }
    }
    updateOutcomeText(`GAME OVER! ${finalMessage}`, "GAME_OVER");
}

/**
 * 模擬下一個打席。
 * @param {object} gameTeams - 包含客隊和主隊數據的物件。
 */
export function playNextAtBat(gameTeams) { // 移除了 teamRecords 參數
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

    // 投手更換邏輯 (簡化)
    const currentPitcher = gameState.activePitcher;
    let potentialNewPitcher = null;
    const pitcherStaminaPercent = currentPitcher.currentStamina / currentPitcher.maxStamina;
    const closerMinInning = Math.max(1, CONFIG.innings - 2); // 終結者可能在倒數第二局上場

    if (currentPitcher.role === 'Starter' && (pitcherStaminaPercent < 0.4 || currentPitcher.gameOutsRecorded > 18)) { // 先發累了 (低於40%體力或投滿6局)
        potentialNewPitcher = fieldingTeam.pitchers.reliever || fieldingTeam.pitchers.closer;
    } else if (currentPitcher.role === 'Reliever' && (pitcherStaminaPercent < 0.3 || currentPitcher.gameOutsRecorded > 6)) { // 中繼累了
        potentialNewPitcher = fieldingTeam.pitchers.closer || fieldingTeam.pitchers.reliever; // 優先考慮終結者
    }
    // 終結者通常只投一局或特定情況
    if (gameState.currentInning >= closerMinInning && currentPitcher.role !== 'Closer' && fieldingTeam.pitchers.closer && fieldingTeam.pitchers.closer.currentStamina > 0) {
        // 如果是關鍵局數且終結者可用，優先考慮
        if ( (battingTeam.totalRuns >= fieldingTeam.totalRuns -3 && battingTeam.totalRuns <= fieldingTeam.totalRuns + 1) || pitcherStaminaPercent < 0.5) {
             potentialNewPitcher = fieldingTeam.pitchers.closer;
        }
    }


    if (potentialNewPitcher && potentialNewPitcher !== currentPitcher && potentialNewPitcher.currentStamina > 0) {
        gameState.activePitcher = potentialNewPitcher;
        updateOutcomeText(`${fieldingTeam.name} brings in ${potentialNewPitcher.role.toLowerCase()} ${potentialNewPitcher.name}.`, "GAME_EVENT");
    }


    const atBatResult = simulateAtBat(gameState.activeBatter, gameState.activePitcher);
    processAtBatOutcome(atBatResult, gameTeams);

    if (!gameState.gameOver) {
        battingTeam.currentBatterIndex = (battingTeam.currentBatterIndex + 1) % battingTeam.batters.length;
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

    if (gameState.currentInning > CONFIG.innings && gameTeams.home.totalRuns === gameTeams.away.totalRuns && !gameState.gameOver) {
        // 進入延長賽邏輯 (如果需要) - 目前會繼續，直到分出勝負或達到最大局數上限 (如果有的話)
        // 如果沒有特別的延長賽結束條件，比賽會繼續直到有一方分數較高
    } else if (gameState.currentInning > CONFIG.innings && gameTeams.home.totalRuns !== gameTeams.away.totalRuns && !gameState.gameOver) {
        endGame(gameTeams); // 如果超過正規局數且非平手，結束比賽
    }
}
