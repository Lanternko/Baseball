// js/gameLogic.js
import { CONFIG } from './config.js';
// Correctly import all needed constants from storageUtils.js
import { saveData, loadData, TEAM_RECORDS_KEY, PLAYER_STATS_KEY } from './storageUtils.js';
import { updateOutcomeText, triggerScoreFlash } from './ui.js';

let gameState = {
    currentInning: 1,
    halfInning: "top",
    outs: 0,
    bases: [null, null, null], // 代表一壘、二壘、三壘上的跑者物件，null 表示無人
    activePitcher: null,       // 目前投手物件
    activeBatter: null,        // 目前打者物件
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

    // 重設比賽數據，而非生涯數據
    for (const teamKey in gameTeams) {
        gameTeams[teamKey].scorePerInning = Array(CONFIG.innings).fill(0);
        gameTeams[teamKey].totalRuns = 0;
        gameTeams[teamKey].totalHits = 0;
        gameTeams[teamKey].totalErrors = 0; // 如果要計算自責分率(ERA)，會需要失誤邏輯
        gameTeams[teamKey].currentBatterIndex = 0;
        if (gameTeams[teamKey].batters) {
            gameTeams[teamKey].batters.forEach(batter => {
                batter.atBats = 0; // 重設比賽打數
                batter.hits = 0;   // 重設比賽安打
                batter.runsBattedIn = 0; // 重設比賽打點
                batter.atBatHistory = []; // 清除比賽歷史
                batter.performanceString = "0-0";
                // 不要重設 batter.careerAtBats 或 batter.careerHits
            });
        }
        if (gameTeams[teamKey].pitchers) {
            for (const pitcherRole in gameTeams[teamKey].pitchers) {
                const pitcher = gameTeams[teamKey].pitchers[pitcherRole];
                if (pitcher) {
                    pitcher.currentStamina = pitcher.maxStamina; // 重設體力
                    // 不要重設生涯投手數據
                }
            }
        }
    }
    // 確保根據（可能）新的 gameTeams 數據設定當前球員
    gameState.activePitcher = gameTeams.home.pitchers.starter;
    gameState.activeBatter = gameTeams.away.batters[gameTeams.away.currentBatterIndex];
    console.log("比賽已初始化:", getGameState());
}

function simulateAtBat(batter, pitcher) {
    // 使用 'power' (球威/綜合能力) 作為基礎
    let effectivePower = pitcher.power;
    let effectiveControl = pitcher.control;

    // 球速對能力的影響
    effectivePower   += (pitcher.velocity - 5) * 0.5; // 球速高，壓制力提升
    effectiveControl += (pitcher.velocity - 5) * 0.2; // 球速高，控球微幅提升 (或視為對打者判斷的影響)

    const staminaPercentage = pitcher.currentStamina > 0 ? (pitcher.currentStamina / pitcher.maxStamina) : 0;

    // 套用體力懲罰
    if (staminaPercentage < CONFIG.stamina.penaltyThreshold2) {
        effectivePower -= CONFIG.stamina.penaltyAmount2;
        effectiveControl -= CONFIG.stamina.penaltyAmount2;
    } else if (staminaPercentage < CONFIG.stamina.penaltyThreshold1) {
        effectivePower -= CONFIG.stamina.penaltyAmount1;
        effectiveControl -= CONFIG.stamina.penaltyAmount1;
    }
    effectivePower = Math.max(1, effectivePower);     // 確保能力值不低於1
    effectiveControl = Math.max(1, effectiveControl); // 確保能力值不低於1

    // 消耗體力
    const staminaDrain = Math.floor(Math.random() * (CONFIG.stamina.depletionPerBatterMax - CONFIG.stamina.depletionPerBatterMin + 1)) + CONFIG.stamina.depletionPerBatterMin;
    pitcher.currentStamina = Math.max(0, pitcher.currentStamina - staminaDrain);

    // --- 機率計算 ---
    let adjRates = { ...CONFIG.baseProbabilities }; // 複製基礎機率

    // 三振率調整
    adjRates.strikeout += (effectivePower - 5) * CONFIG.statNormalization.pitcherPowerEffectOnSO +
                          (pitcher.velocity - 5) * CONFIG.statNormalization.velocityEffectOnSO + // 投手球速影響
                          (pitcher.technique - 5) * CONFIG.statNormalization.techniqueEffectOnSO + // 投手技巧影響
                          (batter.contact - 5) * CONFIG.statNormalization.batterContactEffectOnSO;   // 打者Contact影響
    adjRates.strikeout = Math.max(CONFIG.probabilityCaps.strikeout.min, Math.min(adjRates.strikeout, CONFIG.probabilityCaps.strikeout.max));

    // 保送率調整
    adjRates.walk += ((5 - effectiveControl)) * Math.abs(CONFIG.statNormalization.pitcherControlEffectOnWalk); // 投手控球影響 (控球越低，保送率越高)
    adjRates.walk = Math.max(CONFIG.probabilityCaps.walk.min, Math.min(adjRates.walk, CONFIG.probabilityCaps.walk.max));

    // 全壘打率調整
    adjRates.homeRun += (batter.power - 5) * CONFIG.statNormalization.batterPowerEffectOnHR +    // 打者力量影響
                        (effectivePower - 5) * CONFIG.statNormalization.pitcherPowerEffectOnHR + // 投手球威影響
                        (pitcher.technique - 5) * CONFIG.statNormalization.techniqueEffectOnHR;  // 投手技巧影響
    adjRates.homeRun = Math.max(CONFIG.probabilityCaps.homeRun.min, Math.min(adjRates.homeRun, CONFIG.probabilityCaps.homeRun.max));

    // 其他安打率調整 (一、二、三壘安打)
    adjRates.otherHit += (batter.hitRate - 5) * CONFIG.statNormalization.batterHitRateEffectOnHit + // 打者打擊率影響
                         (effectivePower - 5) * CONFIG.statNormalization.pitcherPowerEffectOnHit +  // 投手球威影響
                         (pitcher.velocity - 5) * CONFIG.statNormalization.velocityEffectOnHit;   // 投手球速影響
    adjRates.otherHit = Math.max(CONFIG.probabilityCaps.otherHit.min, Math.min(adjRates.otherHit, CONFIG.probabilityCaps.otherHit.max));

    // --- 機率正規化與擲骰 ---
    // 確保機率總和不超過設定的上限 (例如0.95)，留下至少給「出局」的空間
    let sumOfDeterminedRates = adjRates.strikeout + adjRates.walk + adjRates.homeRun + adjRates.otherHit;
    if (sumOfDeterminedRates > CONFIG.probabilityCaps.sumOfDeterminedRatesCap) {
        const scaleDown = CONFIG.probabilityCaps.sumOfDeterminedRatesCap / sumOfDeterminedRates;
        adjRates.strikeout *= scaleDown;
        adjRates.walk *= scaleDown;
        adjRates.homeRun *= scaleDown;
        adjRates.otherHit *= scaleDown;
        sumOfDeterminedRates = CONFIG.probabilityCaps.sumOfDeterminedRatesCap; // 更新總和
    }

    // 計算「出局」的機率
    adjRates.out = 1.0 - sumOfDeterminedRates;

    // 確保「出局」機率不低於最小值
    if (adjRates.out < CONFIG.probabilityCaps.outMin) {
        const deficit = CONFIG.probabilityCaps.outMin - adjRates.out;
        adjRates.out = CONFIG.probabilityCaps.outMin;
        // 從其他機率中按比例扣除差額
        const totalToReduceFrom = adjRates.strikeout + adjRates.walk + adjRates.homeRun + adjRates.otherHit;
        if (totalToReduceFrom > 0) { // 避免除以零
            adjRates.strikeout -= deficit * (adjRates.strikeout / totalToReduceFrom);
            adjRates.walk      -= deficit * (adjRates.walk / totalToReduceFrom);
            adjRates.homeRun   -= deficit * (adjRates.homeRun / totalToReduceFrom);
            adjRates.otherHit  -= deficit * (adjRates.otherHit / totalToReduceFrom);
        }
    }
    // 最後確保總和為 1.0
     const finalSum = adjRates.strikeout + adjRates.walk + adjRates.homeRun + adjRates.otherHit + adjRates.out;
     if (finalSum !== 1.0 && finalSum > 0) { // 避免 finalSum 為 0 的情況
         const scale = 1.0 / finalSum;
         adjRates.strikeout *= scale;
         adjRates.walk      *= scale;
         adjRates.homeRun   *= scale;
         adjRates.otherHit  *= scale;
         adjRates.out       *= scale;
     } else if (finalSum === 0) { // 極端情況，如果所有機率都變為0，則強制出局
         adjRates.out = 1.0;
     }


    const random = Math.random();
    let cumulativeProbability = 0;
    let outcome = {};

    // 決定結果
    cumulativeProbability += adjRates.strikeout;
    if (random < cumulativeProbability) { outcome = { event: "STRIKEOUT", description: `${batter.name} STRIKES OUT!  `, batter, pitcher }; }
    else { cumulativeProbability += adjRates.walk;
        if (random < cumulativeProbability) { outcome = { event: "WALK", description: `${batter.name} draws a WALK.  `, batter, pitcher, basesAdvanced: 1 }; }
        else { cumulativeProbability += adjRates.homeRun;
            if (random < cumulativeProbability) { outcome = { event: "HOMERUN", description: `HOME RUN for ${batter.name}!!  `, batter, pitcher, basesAdvanced: 4 }; }
            else { cumulativeProbability += adjRates.otherHit;
                if (random < cumulativeProbability) {
                    // 決定是哪種安打 (一、二、三壘)
                    let hitType = "SINGLE"; let basesAdv = 1;
                    // 這裡可以加入更複雜的邏輯來決定二壘或三壘安打，例如根據打者速度或球場特性
                    if (Math.random() < CONFIG.speed.baseHitIsDoubleChance) { // 基礎二壘打機率
                        hitType = "DOUBLE"; basesAdv = 2;
                    }
                    // 根據速度嘗試將一壘安打延伸為二壘安打
                    if (hitType === "SINGLE" && batter.speed > 7 && Math.random() < CONFIG.speed.stretchSingleToDoubleFast) { hitType = "DOUBLE"; basesAdv = 2; }
                    else if (hitType === "SINGLE" && batter.speed > 5 && Math.random() < CONFIG.speed.stretchSingleToDoubleMedium) { hitType = "DOUBLE"; basesAdv = 2; }
                    // (未來可以加入三壘安打的邏輯)
                    outcome = { event: hitType, description: `${batter.name} hits a ${hitType}!  `, batter, pitcher, basesAdvanced: basesAdv };
                } else { // 出局
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
    let outcomeTypeForUI = atBatOutcome.event; // 用於UI樣式
    let runsScoredThisPlay = 0;
    let isHit = false;
    let isAtBat = true; // 預設為有效打數

    // 記錄打擊歷史 & 更新數據
    const batter = atBatOutcome.batter;
    let historyCode = "OUT"; // 預設為出局
    switch (atBatOutcome.event) {
        case "STRIKEOUT": historyCode = "K"; break;
        case "WALK":      historyCode = "BB"; isAtBat = false; break; // 保送不算打數
        case "SINGLE":    historyCode = "1B"; isHit = true; break;
        case "DOUBLE":    historyCode = "2B"; isHit = true; break;
        case "TRIPLE":    historyCode = "3B"; isHit = true; break; // 假設有三壘安打
        case "HOMERUN":   historyCode = "HR"; isHit = true; break;
    }
    if (batter) { // 確保打者物件存在
        if (batter.atBatHistory) batter.atBatHistory.push(historyCode); // 記錄到打者個人的打擊歷史
        if (isAtBat) {
            batter.atBats = (batter.atBats || 0) + 1;
            batter.careerAtBats = (batter.careerAtBats || 0) + 1; // 累計生涯打數
        }
        if (isHit) {
            batter.hits = (batter.hits || 0) + 1;
            batter.careerHits = (batter.careerHits || 0) + 1;     // 累計生涯安打
        }
        batter.performanceString = `${batter.hits}-${batter.atBats}`; // 更新本場表現字串
    }
    if (isHit) { battingTeam.totalHits = (battingTeam.totalHits || 0) + 1; } // 更新球隊總安打

    // 跑壘和得分邏輯
    if (atBatOutcome.event === "STRIKEOUT" || atBatOutcome.event === "OUT") {
        gameState.outs++;
    } else { // 非出局事件 (安打、保送)
        const batterMoving = atBatOutcome.batter;
        const basesToAdvanceByHit = atBatOutcome.basesAdvanced; // 結果本身推進的壘包數
        let newBases = [...gameState.bases]; // 複製目前壘包狀態

        // 先處理壘上跑者 (從三壘往一壘處理，避免覆蓋)
        for (let i = 2; i >= 0; i--) { // i = 2 (三壘), 1 (二壘), 0 (一壘)
            if (newBases[i]) { // 如果該壘包有跑者
                const runner = newBases[i];
                let runnerSpecificAdvance = basesToAdvanceByHit; // 預設推進壘包數與打擊結果相同

                // 根據跑者速度和安打類型，決定是否多推進壘包
                if (basesToAdvanceByHit === 1 || basesToAdvanceByHit === 2) { // 一壘或二壘安打時
                    if (runner.speed > 7 && Math.random() < CONFIG.speed.runnerExtraBaseFast) runnerSpecificAdvance++;
                    else if (runner.speed > 5 && Math.random() < CONFIG.speed.runnerExtraBaseMedium) runnerSpecificAdvance++;
                }
                const targetBaseIndex = i + runnerSpecificAdvance;
                if (targetBaseIndex >= 3) { // 推進超過三壘表示得分
                    runsScoredThisPlay++;
                    if (batter) batter.runsBattedIn = (batter.runsBattedIn || 0) + 1; // 打點給打者
                    newBases[i] = null; // 清空原壘包
                } else { // 未得分，移動到新壘包
                    newBases[targetBaseIndex] = runner;
                    newBases[i] = null; // 清空原壘包
                }
            }
        }

        // 處理打者上壘
        if (basesToAdvanceByHit === 4) { // 全壘打，打者直接得分
            runsScoredThisPlay++;
            if (batter) batter.runsBattedIn = (batter.runsBattedIn || 0) + 1;
        } else if (atBatOutcome.event === "WALK") { // 保送，強制進壘
            // 處理壘上跑者因保送而被迫推進的情況
            if (newBases[0]) { // 一壘有人
                if (newBases[1]) { // 二壘也有人
                    if (newBases[2]) { // 滿壘，三壘跑者得分
                        runsScoredThisPlay++;
                        if (batter) batter.runsBattedIn = (batter.runsBattedIn || 0) + 1;
                    }
                    newBases[2] = newBases[1]; // 二壘跑者去三壘
                }
                newBases[1] = newBases[0]; // 一壘跑者去二壘
            }
            newBases[0] = batterMoving; // 打者上一壘
        } else { // 其他安打 (一、二、三壘)
             if (basesToAdvanceByHit > 0 && basesToAdvanceByHit <= 3) {
                newBases[basesToAdvanceByHit - 1] = batterMoving; // 打者站上對應壘包
             }
        }
        gameState.bases = [...newBases]; // 更新全域壘包狀態
    }

    // --- 累計投手數據 (簡化版 RA/9 概念) ---
    const pitcher = atBatOutcome.pitcher;
    if (pitcher) {
         if (atBatOutcome.event === "STRIKEOUT" || atBatOutcome.event === "OUT") {
             pitcher.careerOutsRecorded = (pitcher.careerOutsRecorded || 0) + 1;
         }
         if (runsScoredThisPlay > 0) {
             // 為簡化起見，將所有失分計入投手帳下用於 RA/9
             // 真實的自責分率(ERA)需要判斷失分是否為自責分 (需要失誤邏輯)
             pitcher.careerRunsAllowed = (pitcher.careerRunsAllowed || 0) + runsScoredThisPlay;
         }
    }
    // --- 結束投手數據 ---

    // 更新分數
    if (runsScoredThisPlay > 0) {
        const inningIndex = gameState.currentInning - 1;
        if (inningIndex >= 0 && inningIndex < CONFIG.innings) { // 確保局數索引有效
            battingTeam.scorePerInning[inningIndex] = (battingTeam.scorePerInning[inningIndex] || 0) + runsScoredThisPlay;
        }
        battingTeam.totalRuns += runsScoredThisPlay;
        outcomeString += ` (${runsScoredThisPlay} run${runsScoredThisPlay > 1 ? 's' : ''} scored!)`;
        // UI #5: 觸發得分閃爍效果
        triggerScoreFlash(runsScoredThisPlay);
    }

    updateOutcomeText(outcomeString, outcomeTypeForUI); // 更新UI顯示結果
}


function changeHalfInning(gameTeams) {
    // 記錄剛結束半局的球隊得分 (即使是0分也要記錄)
    const teamThatBattedKey = gameState.halfInning === 'top' ? 'away' : 'home';
    const teamThatBatted = gameTeams[teamThatBattedKey];
    const inningIndex = gameState.currentInning - 1;

    if (inningIndex >= 0 && inningIndex < CONFIG.innings) {
        // 確保該局分數被記錄，即使是0
        teamThatBatted.scorePerInning[inningIndex] = teamThatBatted.scorePerInning[inningIndex] || 0;
    }

    gameState.outs = 0;
    gameState.bases = [null, null, null];
    updateOutcomeText("Change Side.", "GAME_EVENT"); // UI提示攻守交換

    if (gameState.halfInning === "top") { // 上半局結束，換下半局
        gameState.halfInning = "bottom";
        const fieldingTeam = gameTeams.away; // 客隊下半局投球
        gameState.activePitcher = fieldingTeam.pitchers.starter; // 預設先發投手
        // 簡易換投邏輯 (可擴展)
        if (gameState.currentInning > 3 && gameState.activePitcher.currentStamina < CONFIG.stamina.penaltyThreshold1 * gameState.activePitcher.maxStamina) {
             gameState.activePitcher = fieldingTeam.pitchers.reliever || fieldingTeam.pitchers.starter; // 如果有中繼，換中繼
        }
        gameState.activeBatter = gameTeams.home.batters[gameTeams.home.currentBatterIndex];

        // 檢查是否需要打最後半局 (例如主隊已領先)
        if (gameState.currentInning === CONFIG.innings && gameTeams.home.totalRuns > gameTeams.away.totalRuns) {
            endGame(gameTeams, `${gameTeams.home.name} win! No need for bottom of the ${CONFIG.innings}th.`);
            return;
        }

    } else { // 下半局結束，換下一局上半局
        gameState.halfInning = "top";
        gameState.currentInning++;
        if (gameState.currentInning > CONFIG.innings) { // 所有局數打完
            endGame(gameTeams); // 結束比賽
            return;
        }
        const fieldingTeam = gameTeams.home; // 主隊上半局投球
        gameState.activePitcher = fieldingTeam.pitchers.starter; // 預設先發投手
        if (gameState.currentInning > 3 && gameState.activePitcher.currentStamina < CONFIG.stamina.penaltyThreshold1 * gameState.activePitcher.maxStamina) {
            gameState.activePitcher = fieldingTeam.pitchers.reliever || fieldingTeam.pitchers.starter;
        }
        gameState.activeBatter = gameTeams.away.batters[gameTeams.away.currentBatterIndex];
    }
}


function endGame(gameTeams, customMessage = "") {
    if (gameState.gameOver) return; // 防止重複執行
    gameState.gameOver = true;
    let winnerKey = null;
    let loserKey = null;

    // 決定勝負
    if (gameTeams.home.totalRuns > gameTeams.away.totalRuns) {
        winnerKey = 'home'; loserKey = 'away';
    } else if (gameTeams.away.totalRuns > gameTeams.home.totalRuns) {
        winnerKey = 'away'; loserKey = 'home';
    }
    // 注意：平手情況在此未明確處理為 winnerKey/loserKey，由後續訊息產生邏輯處理

    // 載入目前戰績記錄
    let teamRecords = loadData(TEAM_RECORDS_KEY, {
         away: { name: gameTeams.away.name, wins: 0, losses: 0 }, // 提供預設值
         home: { name: gameTeams.home.name, wins: 0, losses: 0 }
    });

    // 更新戰績
    if (winnerKey && loserKey) {
        teamRecords[winnerKey].wins++;
        teamRecords[loserKey].losses++;
    }
    // 你可以在這裡加入平手對戰績的處理邏輯 (如果需要)

    // 儲存更新後的戰績
    saveData(TEAM_RECORDS_KEY, teamRecords);

    // 儲存更新後的球員生涯數據 (包含在 gameTeams 物件中)
    saveData(PLAYER_STATS_KEY, gameTeams);

    // 決定最終訊息
    let finalMessage = customMessage;
    if (!finalMessage) { // 如果沒有自訂訊息
        if (gameTeams.home.totalRuns === gameTeams.away.totalRuns) { // 平手
             finalMessage = `It's a TIE after ${gameState.currentInning > CONFIG.innings ? gameState.currentInning -1 : CONFIG.innings} innings! ${gameTeams.home.totalRuns} - ${gameTeams.away.totalRuns}.`;
        } else if (winnerKey === 'home') {
            finalMessage = `${gameTeams.home.name} win ${gameTeams.home.totalRuns} - ${gameTeams.away.totalRuns}!`;
        } else if (winnerKey === 'away') {
            finalMessage = `${gameTeams.away.name} win ${gameTeams.away.totalRuns} - ${gameTeams.home.totalRuns}!`;
        } else { // 理論上不應發生，除非勝負邏輯有誤
             finalMessage = `Game Over. Score: ${gameTeams.away.name} ${gameTeams.away.totalRuns} - ${gameTeams.home.name} ${gameTeams.home.totalRuns}.`;
        }
    }
    updateOutcomeText(`GAME OVER! ${finalMessage}`, "GAME_OVER");
}

export function playNextAtBat(gameTeams) {
    if (gameState.gameOver || !gameState.gameStarted) return;

    const battingTeamKey = gameState.halfInning === 'top' ? 'away' : 'home';
    const battingTeam = gameTeams[battingTeamKey];
    const fieldingTeamKey = gameState.halfInning === 'top' ? 'home' : 'away';
    const fieldingTeam = gameTeams[fieldingTeamKey];

    // 基本驗證
    if (!battingTeam || !battingTeam.batters || battingTeam.currentBatterIndex === undefined) { console.error("打擊隊伍無效"); return; }
    if (!fieldingTeam || !fieldingTeam.pitchers) { console.error("防守隊伍無效"); return; }

    gameState.activeBatter = battingTeam.batters[battingTeam.currentBatterIndex];
    if (!gameState.activeBatter) { // 安全檢查，如果打者索引超出範圍
        console.error(`在索引 ${battingTeam.currentBatterIndex} 找不到 ${battingTeamKey} 的打者`);
        battingTeam.currentBatterIndex = 0; // 重設索引
        gameState.activeBatter = battingTeam.batters[0];
        if (!gameState.activeBatter) { // 如果重設後還是找不到，這是嚴重錯誤
            console.error("嚴重錯誤：重設後打序仍為空或無效。");
            gameState.gameOver = true; // 防止無限迴圈
            updateOutcomeText("嚴重錯誤：打序無效。比賽已停止。", "GAME_ERROR");
            return;
        }
    }

    // 投手選擇/更換邏輯
    const currentPitcher = gameState.activePitcher;
    let potentialNewPitcher = null;
    const pitcherStaminaPercent = currentPitcher.currentStamina / currentPitcher.maxStamina;
    const closerMinInning = Math.max(1, CONFIG.innings - 1); // 終結者在最後兩局可用

    // 根據體力決定是否換投
    if (pitcherStaminaPercent < CONFIG.stamina.penaltyThreshold2 && currentPitcher.role !== "Closer") { // 體力低於第二閾值且不是終結者
         if (gameState.currentInning >= closerMinInning && fieldingTeam.pitchers.closer) { potentialNewPitcher = fieldingTeam.pitchers.closer; }
         else if (fieldingTeam.pitchers.reliever) { potentialNewPitcher = fieldingTeam.pitchers.reliever; }
    } else if (pitcherStaminaPercent < CONFIG.stamina.penaltyThreshold1 && currentPitcher.role === "Starter" && gameState.currentInning > 3) { // 先發投手體力低於第一閾值且已投超過3局
        if (fieldingTeam.pitchers.reliever) { potentialNewPitcher = fieldingTeam.pitchers.reliever; }
    }

    if (potentialNewPitcher && potentialNewPitcher !== currentPitcher) {
         // 只有在新投手有合理體力時才更換
         if (potentialNewPitcher.currentStamina > CONFIG.stamina.penaltyThreshold2 * potentialNewPitcher.maxStamina * 0.5) { // 較保守的更換策略
            gameState.activePitcher = potentialNewPitcher;
            updateOutcomeText(`${fieldingTeam.name} brings in ${potentialNewPitcher.role.toLowerCase()} ${potentialNewPitcher.name}.`, "GAME_EVENT");
         }
    }

    const atBatResult = simulateAtBat(gameState.activeBatter, gameState.activePitcher);
    processAtBatOutcome(atBatResult, gameTeams);

    if (!gameState.gameOver) {
        battingTeam.currentBatterIndex = (battingTeam.currentBatterIndex + 1) % 9; // 輪到下一位打者 (假設9人打序)
        if (gameState.outs >= 3) { // 三出局，攻守交換
            // 在換局前檢查再見勝負條件
            if (gameState.halfInning === 'bottom' && gameState.currentInning >= CONFIG.innings && gameTeams.home.totalRuns > gameTeams.away.totalRuns) {
                endGame(gameTeams, `${gameTeams.home.name} walk it off with a score of ${gameTeams.home.totalRuns} - ${gameTeams.away.totalRuns}!`);
            } else {
                changeHalfInning(gameTeams); // 這可能會因為所有局數打完而結束比賽
                if (!gameState.gameOver) { // 如果比賽在 changeHalfInning 中未結束
                    const newBattingTeamKey = gameState.halfInning === 'top' ? 'away' : 'home';
                    gameState.activeBatter = gameTeams[newBattingTeamKey].batters[gameTeams[newBattingTeamKey].currentBatterIndex];
                }
            }
        } else { // 出局數 < 3，比賽在同半局繼續
             gameState.activeBatter = battingTeam.batters[battingTeam.currentBatterIndex];
        }
    }

    // 最後檢查是否所有局數已完成且比賽未因其他條件結束 (如再見安打)
    if (gameState.currentInning > CONFIG.innings && !gameState.gameOver) {
        endGame(gameTeams);
    }
}
// REMOVED EXTRA CLOSING BRACE FROM HERE
