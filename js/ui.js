// js/ui.js
import { CONFIG } from './config.js';

export const DOM_ELEMENTS = {
    // Game Controls
    startGameButton: document.getElementById('startGameButton'),
    nextPlayButton: document.getElementById('nextPlayButton'),

    // Field Header
    inningDisplay: document.getElementById('inningDisplay'),
    inningIndicator: document.querySelector('#inningDisplay .inning-indicator'),
    inningNumber: document.querySelector('#inningDisplay .inning-number'),
    outsDisplayContainer: document.getElementById('outsDisplay'),
    outLights: document.querySelectorAll('#outsDisplay .out-light'),

    // Scoreboard
    scoreboardTable: document.getElementById('scoreboard'),
    awayTeamScoreRow: document.getElementById('awayTeamScore'),
    homeTeamScoreRow: document.getElementById('homeTeamScore'),
    awayTeamScoreCells: document.querySelector('#awayTeamScore')?.children,
    homeTeamScoreCells: document.querySelector('#homeTeamScore')?.children,
    awayTeamTotalRunsCell: document.querySelector('#awayTeamScore .total-runs'),
    homeTeamTotalRunsCell: document.querySelector('#homeTeamScore .total-runs'),
    awayTeamTotalHitsCell: document.querySelector('#awayTeamScore .total-hits'),
    homeTeamTotalHitsCell: document.querySelector('#homeTeamScore .total-hits'),
    awayTeamTotalErrorsCell: document.querySelector('#awayTeamScore .total-errors'),
    homeTeamTotalErrorsCell: document.querySelector('#homeTeamScore .total-errors'),
    awayTeamScoreboardName: document.querySelector('#awayTeamScore .team-name'),
    homeTeamScoreboardName: document.querySelector('#homeTeamScore .team-name'),

    // Field Display
    firstBaseVisual: document.getElementById('firstBase'),
    secondBaseVisual: document.getElementById('secondBase'),
    thirdBaseVisual: document.getElementById('thirdBase'),
    pitcherOnMoundName: document.getElementById('pitcherOnMoundName'), // Span inside mound div
    runnerName1B: document.getElementById('runnerName1B'),
    runnerName2B: document.getElementById('runnerName2B'),
    runnerName3B: document.getElementById('runnerName3B'),
    scoreFlashElement: document.getElementById('scoreFlash'), // For scoring effect

    // At-Bat Outcome
    outcomeText: document.getElementById('outcome-text'),

    // Team Panels
    awayTeamPanel: document.getElementById('awayTeamPanel'),
    homeTeamPanel: document.getElementById('homeTeamPanel'),
    awayTeamNameDisplayElement: document.getElementById('awayTeamNameDisplay'),
    homeTeamNameDisplayElement: document.getElementById('homeTeamNameDisplay'),
    awayCurrentPlayerDisplay: document.getElementById('awayCurrentPlayerDisplay'),
    homeCurrentPlayerDisplay: document.getElementById('homeCurrentPlayerDisplay'),
    awayTeamLineupList: document.getElementById('awayTeamLineupList'),
    homeTeamLineupList: document.getElementById('homeTeamLineupList'),

    // Mobile Displays
    mobileBatterDisplay: document.getElementById('mobileBatterDisplay'),
    mobilePitcherDisplay: document.getElementById('mobilePitcherDisplay'),
};

// --- UI Initialization ---
export function initializeUI(gameTeams) {
    // Team Names
    if (DOM_ELEMENTS.awayTeamScoreboardName && gameTeams.away) DOM_ELEMENTS.awayTeamScoreboardName.textContent = gameTeams.away.name;
    if (DOM_ELEMENTS.homeTeamScoreboardName && gameTeams.home) DOM_ELEMENTS.homeTeamScoreboardName.textContent = gameTeams.home.name;
    if (DOM_ELEMENTS.awayTeamNameDisplayElement && gameTeams.away) DOM_ELEMENTS.awayTeamNameDisplayElement.textContent = gameTeams.away.name;
    if (DOM_ELEMENTS.homeTeamNameDisplayElement && gameTeams.home) DOM_ELEMENTS.homeTeamNameDisplayElement.textContent = gameTeams.home.name;

    // Reset Displays
    if(DOM_ELEMENTS.inningIndicator) DOM_ELEMENTS.inningIndicator.className = 'inning-indicator';
    if(DOM_ELEMENTS.inningNumber) DOM_ELEMENTS.inningNumber.textContent = '-';
    if(DOM_ELEMENTS.outLights) DOM_ELEMENTS.outLights.forEach(light => light.classList.remove('active'));
    if(DOM_ELEMENTS.outcomeText) { DOM_ELEMENTS.outcomeText.textContent = "Click 'Start New Game' to begin!"; DOM_ELEMENTS.outcomeText.className = ''; }

    // Clear Scoreboard
    const awayCells = DOM_ELEMENTS.awayTeamScoreCells;
    const homeCells = DOM_ELEMENTS.homeTeamScoreCells;
    for (let i = 1; i <= CONFIG.innings; i++) {
        if (awayCells?.[i]) awayCells[i].textContent = '-';
        if (homeCells?.[i]) homeCells[i].textContent = '-';
    }
    if (DOM_ELEMENTS.awayTeamTotalRunsCell) DOM_ELEMENTS.awayTeamTotalRunsCell.textContent = '0';
    if (DOM_ELEMENTS.homeTeamTotalRunsCell) DOM_ELEMENTS.homeTeamTotalRunsCell.textContent = '0';
    if (DOM_ELEMENTS.awayTeamTotalHitsCell) DOM_ELEMENTS.awayTeamTotalHitsCell.textContent = '0';
    if (DOM_ELEMENTS.homeTeamTotalHitsCell) DOM_ELEMENTS.homeTeamTotalHitsCell.textContent = '0';
    if (DOM_ELEMENTS.awayTeamTotalErrorsCell) DOM_ELEMENTS.awayTeamTotalErrorsCell.textContent = '0';
    if (DOM_ELEMENTS.homeTeamTotalErrorsCell) DOM_ELEMENTS.homeTeamTotalErrorsCell.textContent = '0';

    // Clear Bases (Keep labels, remove runner names)
    if(DOM_ELEMENTS.firstBaseVisual) DOM_ELEMENTS.firstBaseVisual.querySelector('.base-label').textContent = '1B';
    if(DOM_ELEMENTS.secondBaseVisual) DOM_ELEMENTS.secondBaseVisual.querySelector('.base-label').textContent = '2B';
    if(DOM_ELEMENTS.thirdBaseVisual) DOM_ELEMENTS.thirdBaseVisual.querySelector('.base-label').textContent = '3B';
    if(DOM_ELEMENTS.runnerName1B) { DOM_ELEMENTS.runnerName1B.textContent = ''; DOM_ELEMENTS.runnerName1B.style.display = 'none'; }
    if(DOM_ELEMENTS.runnerName2B) { DOM_ELEMENTS.runnerName2B.textContent = ''; DOM_ELEMENTS.runnerName2B.style.display = 'none'; }
    if(DOM_ELEMENTS.runnerName3B) { DOM_ELEMENTS.runnerName3B.textContent = ''; DOM_ELEMENTS.runnerName3B.style.display = 'none'; }
    if(DOM_ELEMENTS.pitcherOnMoundName) DOM_ELEMENTS.pitcherOnMoundName.textContent = 'P';


    // Clear Panels
    if(DOM_ELEMENTS.awayTeamLineupList) DOM_ELEMENTS.awayTeamLineupList.innerHTML = '';
    if(DOM_ELEMENTS.homeTeamLineupList) DOM_ELEMENTS.homeTeamLineupList.innerHTML = '';
    if(DOM_ELEMENTS.awayCurrentPlayerDisplay) DOM_ELEMENTS.awayCurrentPlayerDisplay.innerHTML = 'Waiting...';
    if(DOM_ELEMENTS.homeCurrentPlayerDisplay) DOM_ELEMENTS.homeCurrentPlayerDisplay.innerHTML = 'Waiting...';
    if(DOM_ELEMENTS.awayTeamPanel) DOM_ELEMENTS.awayTeamPanel.className = 'team-panel'; // Reset panel colors
    if(DOM_ELEMENTS.homeTeamPanel) DOM_ELEMENTS.homeTeamPanel.className = 'team-panel';
}

// --- Core UI Update Functions ---

function highlightCurrentInningOnScoreboard(currentInning, gameStarted, gameOver, halfInning) {
    if (!DOM_ELEMENTS.scoreboardTable) return;
    DOM_ELEMENTS.scoreboardTable.querySelectorAll('th, td').forEach(cell => cell.classList.remove('current-inning-active'));
    if (gameStarted && !gameOver && currentInning >= 1 && currentInning <= CONFIG.innings) {
        const inningColumnIndex = currentInning;
        const headers = DOM_ELEMENTS.scoreboardTable.querySelectorAll('th');
        if (headers?.[inningColumnIndex]) headers[inningColumnIndex].classList.add('current-inning-active');
        const activeRowCells = halfInning === 'top' ? DOM_ELEMENTS.awayTeamScoreCells : DOM_ELEMENTS.homeTeamScoreCells;
        if (activeRowCells?.[inningColumnIndex]) activeRowCells[inningColumnIndex].classList.add('current-inning-active');
    }
}

export function updateInningDisplay(halfInning, currentInning, gameStarted, gameOver) {
    if (!DOM_ELEMENTS.inningIndicator || !DOM_ELEMENTS.inningNumber) return;
    if (!gameStarted) { DOM_ELEMENTS.inningIndicator.className = 'inning-indicator'; DOM_ELEMENTS.inningNumber.textContent = '-'; return; }
    if (gameOver) { DOM_ELEMENTS.inningIndicator.className = 'inning-indicator'; DOM_ELEMENTS.inningNumber.textContent = 'Final'; return; }
    DOM_ELEMENTS.inningIndicator.className = `inning-indicator ${halfInning}`;
    DOM_ELEMENTS.inningNumber.textContent = currentInning;
}

export function updateOutsDisplay(outs) {
    if (!DOM_ELEMENTS.outLights) return;
    DOM_ELEMENTS.outLights.forEach((light, index) => {
        light.classList.toggle('active', index < outs);
    });
}

export function updateScoreboard(gameTeams, currentInning, halfInning, outs, gameStarted, gameOver) {
    if (!gameTeams) return;
    const awayTeamData = gameTeams.away;
    const homeTeamData = gameTeams.home;
    const awayCells = DOM_ELEMENTS.awayTeamScoreCells;
    const homeCells = DOM_ELEMENTS.homeTeamScoreCells;
    if (!awayCells || !homeCells) { console.error("Scoreboard cells not found."); return; }

    const shouldShowDash = (teamData, inningIndex) => { /* ... same logic ... */
        const inningNum = inningIndex + 1;
        if (!gameStarted || inningNum > currentInning) return true;
        if (inningNum === currentInning) {
            if (teamData === awayTeamData && halfInning === 'top' && !gameOver) return true;
            if (teamData === homeTeamData && halfInning === 'bottom' && outs < 3 && !gameOver) return true;
            if (teamData === homeTeamData && halfInning === 'top' && !gameOver) return true;
        }
        return false;
    };

    for (let i = 0; i < CONFIG.innings; i++) {
        const cellIndex = i + 1;
        if (awayCells[cellIndex]) {
            const runs = awayTeamData.scorePerInning[i];
            awayCells[cellIndex].textContent = shouldShowDash(awayTeamData, i) ? '-' : (runs ?? 0);
        }
        if (homeCells[cellIndex]) {
            const runs = homeTeamData.scorePerInning[i];
            homeCells[cellIndex].textContent = shouldShowDash(homeTeamData, i) ? '-' : (runs ?? 0);
        }
    }

    if (DOM_ELEMENTS.awayTeamTotalRunsCell) DOM_ELEMENTS.awayTeamTotalRunsCell.textContent = awayTeamData.totalRuns;
    if (DOM_ELEMENTS.homeTeamTotalRunsCell) DOM_ELEMENTS.homeTeamTotalRunsCell.textContent = homeTeamData.totalRuns;
    if (DOM_ELEMENTS.awayTeamTotalHitsCell) DOM_ELEMENTS.awayTeamTotalHitsCell.textContent = awayTeamData.totalHits || 0;
    if (DOM_ELEMENTS.homeTeamTotalHitsCell) DOM_ELEMENTS.homeTeamTotalHitsCell.textContent = homeTeamData.totalHits || 0;
    if (DOM_ELEMENTS.awayTeamTotalErrorsCell) DOM_ELEMENTS.awayTeamTotalErrorsCell.textContent = awayTeamData.totalErrors || 0;
    if (DOM_ELEMENTS.homeTeamTotalErrorsCell) DOM_ELEMENTS.homeTeamTotalErrorsCell.textContent = homeTeamData.totalErrors || 0;

    highlightCurrentInningOnScoreboard(currentInning, gameStarted, gameOver, halfInning);
}

// UI #2 & #5: Update bases (no home plate, rotated labels handled by CSS)
export function updateBasesDisplay(bases, activePitcher) {
    const runnerNameElements = [DOM_ELEMENTS.runnerName1B, DOM_ELEMENTS.runnerName2B, DOM_ELEMENTS.runnerName3B];
    const baseElements = [DOM_ELEMENTS.firstBaseVisual, DOM_ELEMENTS.secondBaseVisual, DOM_ELEMENTS.thirdBaseVisual];

    for (let i = 0; i < 3; i++) {
        const nameEl = runnerNameElements[i];
        const baseEl = baseElements[i];
        if (!nameEl || !baseEl) continue;

        if (bases[i]) {
            nameEl.textContent = bases[i].name;
            nameEl.style.display = 'block';
            baseEl.classList.add('occupied-base'); // 添加類別
        } else {
            nameEl.textContent = '';
            nameEl.style.display = 'none';
            baseEl.classList.remove('occupied-base'); // 移除類別
        }
    }

}

// UI #4: Helper function for stat colors (Updated for text color)
function getStatColorClass(value) {
    if (value === undefined || value === null) return '';
    if (value <= CONFIG.statColors.low) return 'stat-low';       // Gray text
    if (value <= CONFIG.statColors.medium) return 'stat-medium'; // Green text
    if (value <= CONFIG.statColors.high) return 'stat-high';    // Yellow text
    return 'stat-elite'; // Red text
}

// UI #6: Abbreviate pitcher role
function getPitcherRoleAbbreviation(role) {
    switch (role?.toLowerCase()) {
        case 'starter': return 'SP';
        case 'reliever': return 'RP';
        case 'closer': return 'CP';
        default: return role || '?';
    }
}

// UI #1, #3.1, #4, #6: Display current player details
function displayCurrentPlayer(player, isBatter, targetElement) {
    if (!targetElement) return;
    targetElement.innerHTML = '';
    if (!player) {
        targetElement.innerHTML = `<p>${isBatter ? 'Batter' : 'Pitcher'} info not available.</p>`;
        return;
    }

    let statsGridHTML = '';
    let historyHTML = '';
    const roleAbbrev = getPitcherRoleAbbreviation(player.role);
    const roleOrPosition = isBatter ? `(#${player.battingOrder || '?'})` : `(${roleAbbrev})`;

    // UI #3: Stat Number Styling (Black background, colored text)
    if (isBatter) {
        statsGridHTML = `
            <span class="stat-label">POWER</span><span class="stat-value ${getStatColorClass(player.power)}">${player.power}</span>
            <span class="stat-label">HIT</span><span class="stat-value ${getStatColorClass(player.hitRate)}">${player.hitRate}</span>
            <span class="stat-label">CONTACT</span><span class="stat-value ${getStatColorClass(player.contact)}">${player.contact}</span>
            <span class="stat-label">SPEED</span><span class="stat-value ${getStatColorClass(player.speed)}">${player.speed}</span>
        `;
        const history = player.atBatHistory || [];
        const historyItems = history.map(item => `<span>${item}</span>`).join(' ');
        historyHTML = `History: ${history.length > 0 ? historyItems : 'N/A'}`;
    }  else { // Pitcher
        
        const filled = player.currentStamina / player.maxStamina * 100;
        const empty  = 100 - filled;        // 要遮掉的百分比

        statsGridHTML = `
        <span class="stat-label">POWER</span><span class="stat-value ${getStatColorClass(player.power)}">${player.power}</span>
        <span class="stat-label">CONTROL</span><span class="stat-value ${getStatColorClass(player.control)}">${player.control}</span>
        <span class="stat-label">VELOCITY</span><span class="stat-value ${getStatColorClass(player.velocity)}">${player.velocity}</span>
        <span class="stat-label">TECHNIQUE</span><span class="stat-value ${getStatColorClass(player.technique)}">${player.technique}</span>
        <span class="stat-label">STAMINA</span>
        <div class="stamina-bar-container">
            
            <div class="stamina-empty" style="width:${empty}%"></div>
            <span class="stamina-text">
                ${player.currentStamina}/${player.maxStamina}
            </span>
        </div>
        `;
    
    }

    targetElement.innerHTML = `
        <h5>
            <span class="player-main-name">${player.name}</span>
            <span>${roleOrPosition} <span class="player-ovr-small">OVR: ${player.ovr}</span></span>
        </h5>
        <div class="player-stats-detailed">${statsGridHTML}</div>
        ${isBatter ? `<div class="player-history">${historyHTML}</div>` : ''}
    `;
}

function getStaminaGradientColor() {
    return 'linear-gradient(to right, red, orange 10%, limegreen 80%)';
}



// UI #3 & #4: Update lineup list (highlight CURRENT batter + score)
function displaySingleTeamLineupList(teamKey, gameTeamsData, currentActiveBatter) {
    const team = gameTeamsData[teamKey];
    const listElement = teamKey === 'away' ? DOM_ELEMENTS.awayTeamLineupList : DOM_ELEMENTS.homeTeamLineupList;
    if (!team || !team.batters || !listElement) return;

    listElement.innerHTML = '';
    team.batters.forEach((batter, index) => {
        const listItem = document.createElement('li');
        const battingOrder = index + 1;
        // Highlight the batter *currently* at bat
        if (batter === currentActiveBatter) {
            listItem.classList.add('current-batter-in-lineup');
        }
        listItem.innerHTML = `
            <div class="player-info-block">
                 <div class="player-name-ovr">
                    <span class="player-name">${battingOrder}. ${batter.name}</span>
                    <span class="player-ovr">OVR: ${batter.ovr}</span>
                </div>
            </div>
            <span class="batter-score">${batter.performanceString || '0-0'}</span>
        `;
        listElement.appendChild(listItem);
    });
}

// UI #5: Score Flash Effect
export function triggerScoreFlash(runsScored) {
    if (!DOM_ELEMENTS.scoreFlashElement || runsScored <= 0) return;

    DOM_ELEMENTS.scoreFlashElement.textContent = `+${runsScored} Run${runsScored > 1 ? 's' : ''}!`;
    DOM_ELEMENTS.scoreFlashElement.classList.add('show');

    // Remove the class after the animation finishes
    setTimeout(() => {
        DOM_ELEMENTS.scoreFlashElement.classList.remove('show');
    }, 600); // Duration should match CSS transition + a little buffer
}


export function updateAllDisplays(gameState, gameTeams) {
    if (!gameState || !gameTeams) { console.error("Missing gameState or gameTeams"); return; }

    const isMobileView = window.innerWidth <= 768; // 簡單的寬度判斷

    // Update Inning/Outs/Bases/Scoreboard
    updateInningDisplay(gameState.halfInning, gameState.currentInning, gameState.gameStarted, gameState.gameOver);
    updateOutsDisplay(gameState.outs);
    updateBasesDisplay(gameState.bases, gameState.activePitcher);
    updateScoreboard(gameTeams, gameState.currentInning, gameState.halfInning, gameState.outs, gameState.gameStarted, gameState.gameOver); // Scoreboard 更新邏輯不變，CSS 會處理顯示

    const battingTeamKey = gameState.halfInning === 'top' ? 'away' : 'home';
    const fieldingTeamKey = gameState.halfInning === 'top' ? 'home' : 'away';
    const battingTeam = gameTeams[battingTeamKey];
    const currentBatterForDisplay = gameState.activeBatter;
    const currentPitcherForDisplay = gameState.activePitcher;

    if (currentBatterForDisplay && battingTeam && battingTeam.batters) {
        const currentBatterActualIndex = battingTeam.batters.findIndex(b => b === currentBatterForDisplay);
        currentBatterForDisplay.battingOrder = (currentBatterActualIndex !== -1) ? currentBatterActualIndex + 1 : '?';
    }

    if (isMobileView) {
        // 手機版面：更新到 mobile display divs
        if (DOM_ELEMENTS.mobileBatterDisplay) {
            displayCurrentPlayer(currentBatterForDisplay, true, DOM_ELEMENTS.mobileBatterDisplay);
        }
        if (DOM_ELEMENTS.mobilePitcherDisplay) {
            displayCurrentPlayer(currentPitcherForDisplay, false, DOM_ELEMENTS.mobilePitcherDisplay);
        }
        // 確保電腦版的 player display 是空的或隱藏的 (CSS 應該已處理隱藏)
        if (DOM_ELEMENTS.awayCurrentPlayerDisplay) DOM_ELEMENTS.awayCurrentPlayerDisplay.innerHTML = '';
        if (DOM_ELEMENTS.homeCurrentPlayerDisplay) DOM_ELEMENTS.homeCurrentPlayerDisplay.innerHTML = '';

    } else {
        // 電腦版面：使用原來的 team panel displays
        if (battingTeamKey === 'away') {
            displayCurrentPlayer(currentBatterForDisplay, true, DOM_ELEMENTS.awayCurrentPlayerDisplay);
            displayCurrentPlayer(currentPitcherForDisplay, false, DOM_ELEMENTS.homeCurrentPlayerDisplay);
            if (DOM_ELEMENTS.awayTeamPanel) DOM_ELEMENTS.awayTeamPanel.className = 'team-panel batting-team';
            if (DOM_ELEMENTS.homeTeamPanel) DOM_ELEMENTS.homeTeamPanel.className = 'team-panel fielding-team';
        } else {
            displayCurrentPlayer(currentBatterForDisplay, true, DOM_ELEMENTS.homeCurrentPlayerDisplay);
            displayCurrentPlayer(currentPitcherForDisplay, false, DOM_ELEMENTS.awayCurrentPlayerDisplay);
            if (DOM_ELEMENTS.homeTeamPanel) DOM_ELEMENTS.homeTeamPanel.className = 'team-panel batting-team';
            if (DOM_ELEMENTS.awayTeamPanel) DOM_ELEMENTS.awayTeamPanel.className = 'team-panel fielding-team';
        }
        // 更新 Lineup Lists (手機版不需要)
        displaySingleTeamLineupList('away', gameTeams, gameState.halfInning === 'top' ? currentBatterForDisplay : null);
        displaySingleTeamLineupList('home', gameTeams, gameState.halfInning === 'bottom' ? currentBatterForDisplay : null);
    }
}


const eventKeywords = {
    'strikes out': 'strikeout',
    'grounds out': 'out',
    'flies out': 'out',
    'pops up': 'out',
    'lines out': 'out',
    'out': 'out',
    'home run': 'homerun',
    'single': 'single',
    'double': 'double',
    'triple': 'triple',
    'walk': 'walk'
};



export function updateOutcomeText(message, outcomeType) {
    if (!DOM_ELEMENTS.outcomeText) return;
    DOM_ELEMENTS.outcomeText.textContent = '';
    DOM_ELEMENTS.outcomeText.className = 'outcome-neutral';

    let regex = Object.keys(eventKeywords).join('|');
    regex = new RegExp(`\\b(${regex})\\b`, 'gi');
    const parts = message.split(regex);

    parts.forEach(part => {
        const span = document.createElement('span');
        span.textContent = part;
        const lowerPart = part.toLowerCase();
        if (eventKeywords.hasOwnProperty(lowerPart)) { // 使用hasOwnProperty
            span.className = `outcome-${eventKeywords[lowerPart]}`;
        }
        DOM_ELEMENTS.outcomeText.appendChild(span);
    });
}