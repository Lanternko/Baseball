// js/ui.js
import { CONFIG } from './config.js';

export const DOM_ELEMENTS = {
    // Game Controls
    startGameButton: document.getElementById('startGameButton'),
    nextPlayButton: document.getElementById('nextPlayButton'),
    // Simulation Controls Container
    simulationControlsContainer: document.querySelector('.simulation-controls'), // Get the container
    // Simulation Buttons
    simInningButton: document.getElementById('simInningButton'),
    simGameButton: document.getElementById('simGameButton'),
    sim10GamesButton: document.getElementById('sim10GamesButton'),

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
    runnerName1B: document.getElementById('runnerName1B'),
    runnerName2B: document.getElementById('runnerName2B'),
    runnerName3B: document.getElementById('runnerName3B'),
    scoreFlashElement: document.getElementById('scoreFlash'),

    // At-Bat Outcome
    outcomeText: document.getElementById('outcome-text'),

    // Team Panels (Desktop)
    awayTeamPanel: document.getElementById('awayTeamPanel'),
    homeTeamPanel: document.getElementById('homeTeamPanel'),
    awayTeamNameDisplayElement: document.getElementById('awayTeamNameDisplay'),
    homeTeamNameDisplayElement: document.getElementById('homeTeamNameDisplay'),
    awayCurrentPlayerDisplay: document.getElementById('awayCurrentPlayerDisplay'),
    homeCurrentPlayerDisplay: document.getElementById('homeCurrentPlayerDisplay'),
    awayTeamLineupList: document.getElementById('awayTeamLineupList'),
    homeTeamLineupList: document.getElementById('homeTeamLineupList'),
    awayTeamBullpenList: document.getElementById('awayTeamBullpenList'),
    homeTeamBullpenList: document.getElementById('homeTeamBullpenList'),

    // Mobile Displays
    mobileBatterDisplay: document.getElementById('mobileBatterDisplay'),
    mobilePitcherDisplay: document.getElementById('mobilePitcherDisplay'),

    // Standings Spans
    awayTeamRecordSpan: document.getElementById('awayTeamRecord'),
    homeTeamRecordSpan: document.getElementById('homeTeamRecord'),
};

// --- UI Initialization ---
export function initializeUI(gameTeams, teamRecords) {
    if (DOM_ELEMENTS.awayTeamScoreboardName && gameTeams.away) DOM_ELEMENTS.awayTeamScoreboardName.textContent = gameTeams.away.name;
    if (DOM_ELEMENTS.homeTeamScoreboardName && gameTeams.home) DOM_ELEMENTS.homeTeamScoreboardName.textContent = gameTeams.home.name;
    if (DOM_ELEMENTS.awayTeamNameDisplayElement && gameTeams.away) {
        DOM_ELEMENTS.awayTeamNameDisplayElement.childNodes[0].nodeValue = gameTeams.away.name + " ";
    }
    if (DOM_ELEMENTS.homeTeamNameDisplayElement && gameTeams.home) {
        DOM_ELEMENTS.homeTeamNameDisplayElement.childNodes[0].nodeValue = gameTeams.home.name + " ";
    }

    if(DOM_ELEMENTS.inningIndicator) DOM_ELEMENTS.inningIndicator.className = 'inning-indicator';
    if(DOM_ELEMENTS.inningNumber) DOM_ELEMENTS.inningNumber.textContent = '-';
    if(DOM_ELEMENTS.outLights) DOM_ELEMENTS.outLights.forEach(light => light.classList.remove('active'));
    if(DOM_ELEMENTS.outcomeText) { DOM_ELEMENTS.outcomeText.innerHTML = "Click 'Start New Game' to begin!"; DOM_ELEMENTS.outcomeText.className = ''; }

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

    if(DOM_ELEMENTS.firstBaseVisual) DOM_ELEMENTS.firstBaseVisual.classList.remove('occupied-base');
    if(DOM_ELEMENTS.secondBaseVisual) DOM_ELEMENTS.secondBaseVisual.classList.remove('occupied-base');
    if(DOM_ELEMENTS.thirdBaseVisual) DOM_ELEMENTS.thirdBaseVisual.classList.remove('occupied-base');
    if(DOM_ELEMENTS.runnerName1B) { DOM_ELEMENTS.runnerName1B.textContent = ''; DOM_ELEMENTS.runnerName1B.style.display = 'none'; }
    if(DOM_ELEMENTS.runnerName2B) { DOM_ELEMENTS.runnerName2B.textContent = ''; DOM_ELEMENTS.runnerName2B.style.display = 'none'; }
    if(DOM_ELEMENTS.runnerName3B) { DOM_ELEMENTS.runnerName3B.textContent = ''; DOM_ELEMENTS.runnerName3B.style.display = 'none'; }

    const waitingMessage = '<p style="text-align:center; color:#777; font-style:italic;">Waiting...</p>';
    if(DOM_ELEMENTS.awayTeamLineupList) DOM_ELEMENTS.awayTeamLineupList.innerHTML = '';
    if(DOM_ELEMENTS.homeTeamLineupList) DOM_ELEMENTS.homeTeamLineupList.innerHTML = '';
    if(DOM_ELEMENTS.awayCurrentPlayerDisplay) DOM_ELEMENTS.awayCurrentPlayerDisplay.innerHTML = waitingMessage;
    if(DOM_ELEMENTS.homeCurrentPlayerDisplay) DOM_ELEMENTS.homeCurrentPlayerDisplay.innerHTML = waitingMessage;
    if(DOM_ELEMENTS.mobileBatterDisplay) DOM_ELEMENTS.mobileBatterDisplay.innerHTML = waitingMessage;
    if(DOM_ELEMENTS.mobilePitcherDisplay) DOM_ELEMENTS.mobilePitcherDisplay.innerHTML = waitingMessage;
    
    if(DOM_ELEMENTS.awayTeamBullpenList) DOM_ELEMENTS.awayTeamBullpenList.innerHTML = '';
    if(DOM_ELEMENTS.homeTeamBullpenList) DOM_ELEMENTS.homeTeamBullpenList.innerHTML = '';

    if(DOM_ELEMENTS.awayTeamPanel) DOM_ELEMENTS.awayTeamPanel.className = 'team-panel';
    if(DOM_ELEMENTS.homeTeamPanel) DOM_ELEMENTS.homeTeamPanel.className = 'team-panel';
    
    // Hide simulation controls initially
    if (DOM_ELEMENTS.simulationControlsContainer) {
        DOM_ELEMENTS.simulationControlsContainer.style.display = 'none';
    }


    updateStandingsDisplay(teamRecords);
}

function getOvrColorClass(ovr) {
    if (ovr === undefined || ovr === null) return '';
    const thresholds = CONFIG.ovrColorSettings.thresholds;
    const classes = CONFIG.ovrColorSettings.classes;

    if (ovr <= thresholds.gray) return classes.gray;
    if (ovr <= thresholds.blue) return classes.blue;
    if (ovr <= thresholds.red) return classes.red;
    if (ovr <= thresholds.green) return classes.green;
    if (ovr <= thresholds.golden) return classes.golden;
    return '';
}

function abbreviatePlayerName(fullName, maxLength = 16, panelWidthChars = 15) {
    if (fullName.length <= panelWidthChars) { return fullName; }
    const parts = fullName.split(' ');
    if (parts.length > 1) {
        let abbreviated = `${parts[0][0]}. ${parts.slice(-1)[0]}`;
        if (abbreviated.length <= maxLength) { return abbreviated; }
        const lastNamePartLength = maxLength - 3;
        if (parts.slice(-1)[0].length > lastNamePartLength) {
             abbreviated = `${parts[0][0]}. ${parts.slice(-1)[0].substring(0, Math.max(1,lastNamePartLength-3))}...`;
             return abbreviated;
        }
        return fullName.substring(0, maxLength - 3) + "...";
    }
    return fullName.substring(0, maxLength - 3) + "...";
}

function highlightCurrentInningOnScoreboard(currentInning, gameStarted, gameOver, halfInning) {
    if (!DOM_ELEMENTS.scoreboardTable) return;
    DOM_ELEMENTS.scoreboardTable.querySelectorAll('thead th, tbody td').forEach(cell => cell.classList.remove('current-inning-active'));

    if (gameStarted && !gameOver && currentInning >= 1 && currentInning <= CONFIG.innings) {
        const inningColumnIndex = currentInning;
        const headers = DOM_ELEMENTS.scoreboardTable.querySelectorAll('thead th');
        if (headers && headers.length > inningColumnIndex) {
            headers[inningColumnIndex].classList.add('current-inning-active');
        }
        const activeRowCells = halfInning === 'top' ? DOM_ELEMENTS.awayTeamScoreCells : DOM_ELEMENTS.homeTeamScoreCells;
        if (activeRowCells && activeRowCells.length > inningColumnIndex) {
            activeRowCells[inningColumnIndex].classList.add('current-inning-active');
        }
    }
}

export function updateInningDisplay(halfInning, currentInning, gameStarted, gameOver) {
    if (!DOM_ELEMENTS.inningIndicator || !DOM_ELEMENTS.inningNumber) return;
    if (!gameStarted) { DOM_ELEMENTS.inningIndicator.className = 'inning-indicator'; DOM_ELEMENTS.inningNumber.textContent = '-'; return; }
    if (gameOver) { DOM_ELEMENTS.inningIndicator.className = 'inning-indicator'; DOM_ELEMENTS.inningNumber.textContent = 'Final'; return; }
    DOM_ELEMENTS.inningIndicator.className = `inning-indicator ${halfInning}`;
    DOM_ELEMENTS.inningNumber.textContent = String(currentInning);
}

export function updateOutsDisplay(outs) {
    if (!DOM_ELEMENTS.outLights) return;
    DOM_ELEMENTS.outLights.forEach((light, index) => {
        light.classList.toggle('active', index < outs);
    });
}

export function updateScoreboard(gameTeams, currentInning, halfInning, outs, gameStarted, gameOver) {
    if (!gameTeams || !gameTeams.away || !gameTeams.home) { console.error("Team data missing for scoreboard update."); return; }
    const awayTeamData = gameTeams.away;
    const homeTeamData = gameTeams.home;
    const awayCells = DOM_ELEMENTS.awayTeamScoreCells;
    const homeCells = DOM_ELEMENTS.homeTeamScoreCells;
    if (!awayCells || !homeCells) { console.error("Scoreboard cells not found."); return; }

    const shouldShowDash = (teamData, inningIndex) => {
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

export function updateBasesDisplay(bases, activePitcher) {
    const runnerNameElements = [DOM_ELEMENTS.runnerName1B, DOM_ELEMENTS.runnerName2B, DOM_ELEMENTS.runnerName3B];
    const baseElements = [DOM_ELEMENTS.firstBaseVisual, DOM_ELEMENTS.secondBaseVisual, DOM_ELEMENTS.thirdBaseVisual];
    for (let i = 0; i < 3; i++) {
        const nameEl = runnerNameElements[i];
        const baseEl = baseElements[i];
        if (!nameEl || !baseEl) continue;
        if (bases[i]) {
            nameEl.textContent = abbreviatePlayerName(bases[i].name, 10, 8);
            nameEl.style.display = 'block';
            baseEl.classList.add('occupied-base');
        } else {
            nameEl.textContent = '';
            nameEl.style.display = 'none';
            baseEl.classList.remove('occupied-base');
        }
    }
}

function getStatColorClass(value) {
    if (value === undefined || value === null) return '';
    if (value <= CONFIG.statColors.low) return 'stat-low';
    if (value <= CONFIG.statColors.medium) return 'stat-medium';
    if (value <= CONFIG.statColors.high) return 'stat-high';
    return 'stat-elite';
}

function getPitcherRoleAbbreviation(role) {
    switch (role?.toLowerCase()) {
        case 'starter': return 'SP';
        case 'reliever': return 'RP';
        case 'closer': return 'CP';
        default: return role || '?';
    }
}

function displayCurrentPlayer(player, isBatter, targetElement) {
    if (!targetElement) return;
    targetElement.innerHTML = '';

    Object.values(CONFIG.ovrColorSettings.classes).forEach(className => {
        targetElement.classList.remove(className);
    });

    if (!player) {
        targetElement.innerHTML = `<p style="text-align:center; color:#777; font-style:italic;">${isBatter ? 'Batter' : 'Pitcher'} info not available.</p>`;
        return;
    }

    const ovrClass = getOvrColorClass(player.ovr);
    if (ovrClass) {
        targetElement.classList.add(ovrClass);
    }

    const nameString = player.name;
    const roleUiString = isBatter ? `(#${player.battingOrder || '?'})` : `(${getPitcherRoleAbbreviation(player.role)})`;
    const ovrUiString = `OVR: ${player.ovr}`;
    let careerStatString = '';
    let statsGridHTML = '';
    let historyDisplayHTML = '';

    if (isBatter) {
        const avg = (player.careerAtBats || 0) > 0 ? ((player.careerHits || 0) / player.careerAtBats) : 0;
        const hr = player.careerHomeRuns || 0;
        careerStatString = `AVG: ${avg.toFixed(3).replace(/^0/, '')} / HR: ${hr}`;
        statsGridHTML = `
            <span class="stat-label">POW</span><span class="stat-value ${getStatColorClass(player.power)}">${player.power}</span>
            <span class="stat-label">HIT</span><span class="stat-value ${getStatColorClass(player.hitRate)}">${player.hitRate}</span>
            <span class="stat-label">CON</span><span class="stat-value ${getStatColorClass(player.contact)}">${player.contact}</span>
            <span class="stat-label">SPD</span><span class="stat-value ${getStatColorClass(player.speed)}">${player.speed}</span>
        `;
        const gameHistory = player.atBatHistory || [];
        const historyItems = gameHistory.map(item => `<span>${item}</span>`).join(' ');
        if (gameHistory.length > 0 && targetElement !== DOM_ELEMENTS.mobileBatterDisplay) {
             historyDisplayHTML = `<div class="player-history">History: ${historyItems}</div>`;
        }
    } else { // Pitcher
        const outs = player.careerOutsRecorded || 0;
        const runs = player.careerRunsAllowed || 0;
        const ra9 = outs > 0 ? (runs / outs * 27) : 0; 
        const so = player.careerStrikeouts || 0;
        careerStatString = `ERA: ${outs > 0 ? ra9.toFixed(2) : 'N/A'} / SO: ${so}`;
        const staminaFilledPercent = player.maxStamina > 0 ? (player.currentStamina / player.maxStamina * 100) : 0;
        
        statsGridHTML = `
            <span class="stat-label">POW</span><span class="stat-value ${getStatColorClass(player.power)}">${player.power}</span>
            <span class="stat-label">CON</span><span class="stat-value ${getStatColorClass(player.control)}">${player.control}</span>
            <span class="stat-label">VEL</span><span class="stat-value ${getStatColorClass(player.velocity)}">${player.velocity}</span>
            <span class="stat-label">TEC</span><span class="stat-value ${getStatColorClass(player.technique)}">${player.technique}</span>
            <span class="stat-label">STM</span>
            <div class="stamina-bar-container">
                <div class="stamina-empty" style="width:${100 - staminaFilledPercent.toFixed(1)}%"></div>
                <span class="stamina-text">${player.currentStamina}/${player.maxStamina}</span>
            </div>
        `;
    }

    targetElement.innerHTML = `
        <h5>
            <span class="player-main-name">${nameString}</span>
            <span class="player-role-info">${roleUiString}</span>
            <span class="player-ovr-info">${ovrUiString}</span>
            <span class="player-career-stat">${careerStatString}</span>
        </h5>
        <div class="player-stats-detailed">${statsGridHTML}</div>
        ${historyDisplayHTML}
    `;
}

function displaySingleTeamLineupList(teamKey, gameTeamsData, currentActiveBatter) {
    const team = gameTeamsData[teamKey];
    const listElement = teamKey === 'away' ? DOM_ELEMENTS.awayTeamLineupList : DOM_ELEMENTS.homeTeamLineupList;
    if (!team || !team.batters || !listElement) return;

    listElement.innerHTML = '';
    team.batters.forEach((batter) => { 
        const listItem = document.createElement('li');
        if (batter === currentActiveBatter) {
            listItem.classList.add('current-batter-in-lineup');
        }

        const careerAB = batter.careerAtBats || 0;
        const careerH = batter.careerHits || 0;
        const avg = careerAB > 0 ? (careerH / careerAB) : 0;
        const avgString = avg.toFixed(3).replace(/^0/, '');
        const hr = batter.careerHomeRuns || 0;

        const ovrClass = getOvrColorClass(batter.ovr);

        listItem.innerHTML = `
            <span class="player-ovr-lineup ${ovrClass}">${batter.ovr}</span>
            <span class="player-name-lineup ${ovrClass}">${batter.name}</span>
            <span class="batter-career-stats">${avgString} / ${hr}HR</span>
        `;
        listElement.appendChild(listItem);
    });
}

export function displayTeamBullpen(teamKey, gameTeamsData, activePitcher) {
    const team = gameTeamsData[teamKey];
    const listElement = teamKey === 'away' ? DOM_ELEMENTS.awayTeamBullpenList : DOM_ELEMENTS.homeTeamBullpenList;

    if (!team || !team.pitchers || !listElement) {
        if (listElement) listElement.innerHTML = '<li>Pitcher data not available.</li>';
        return;
    }

    listElement.innerHTML = ''; 

    const bullpenPitchers = [];
    if (team.pitchers.starter) bullpenPitchers.push(team.pitchers.starter);
    if (team.pitchers.reliever) bullpenPitchers.push(team.pitchers.reliever);
    if (team.pitchers.closer) bullpenPitchers.push(team.pitchers.closer);
    
    const validBullpenPitchers = bullpenPitchers.filter(p => p);

    if (validBullpenPitchers.length === 0) {
        listElement.innerHTML = '<li>No pitchers available.</li>';
        return;
    }

    validBullpenPitchers.forEach(pitcher => {
        const listItem = document.createElement('li');
        const ovrClass = getOvrColorClass(pitcher.ovr);
        
        const outs = pitcher.careerOutsRecorded || 0;
        const runs = pitcher.careerRunsAllowed || 0;
        const era = outs > 0 ? (runs / outs * 27) : 0;
        const eraString = outs > 0 ? era.toFixed(2) : "N/A";

        if (activePitcher && activePitcher.name === pitcher.name && activePitcher.role === pitcher.role) {
            listItem.classList.add('active-pitcher-in-bullpen');
        }

        listItem.innerHTML = `
            <span class="bullpen-pitcher-ovr ${ovrClass}">${pitcher.ovr}</span>
            <span class="bullpen-pitcher-name ${ovrClass}">${pitcher.name}</span>
            <span class="bullpen-pitcher-role">${getPitcherRoleAbbreviation(pitcher.role)}</span>
            <span class="bullpen-pitcher-era">${eraString}</span>
            <span class="bullpen-pitcher-stamina">${pitcher.currentStamina}/${pitcher.maxStamina}</span>
        `;
        listElement.appendChild(listItem);
    });
}


export function triggerScoreFlash(runsScored) {
    if (!DOM_ELEMENTS.scoreFlashElement || runsScored <= 0) return;
    DOM_ELEMENTS.scoreFlashElement.textContent = `+${runsScored} Run${runsScored > 1 ? 's' : ''}!`;
    DOM_ELEMENTS.scoreFlashElement.classList.add('show');
    setTimeout(() => {
        DOM_ELEMENTS.scoreFlashElement.classList.remove('show');
    }, 600);
}

export function updateAllDisplays(gameState, gameTeams, teamRecords) {
    if (!gameState || !gameTeams) { console.error("Missing gameState or gameTeams for updateAllDisplays"); return; }
    const isMobileView = window.innerWidth <= 768;

    updateInningDisplay(gameState.halfInning, gameState.currentInning, gameState.gameStarted, gameState.gameOver);
    updateOutsDisplay(gameState.outs);
    updateBasesDisplay(gameState.bases, gameState.activePitcher);
    updateScoreboard(gameTeams, gameState.currentInning, gameState.halfInning, gameState.outs, gameState.gameStarted, gameState.gameOver);

    const battingTeamKey = gameState.halfInning === 'top' ? 'away' : 'home';
    const currentBatterForDisplay = gameState.activeBatter;
    const currentPitcherForDisplay = gameState.activePitcher;

    if (currentBatterForDisplay && gameTeams[battingTeamKey] && gameTeams[battingTeamKey].batters) {
        const currentBatterActualIndex = gameTeams[battingTeamKey].batters.findIndex(b => b.name === currentBatterForDisplay.name);
        currentBatterForDisplay.battingOrder = (currentBatterActualIndex !== -1) ? currentBatterActualIndex + 1 : '?';
    }

    updateStandingsDisplay(teamRecords);

    if (isMobileView) {
        if (DOM_ELEMENTS.mobileBatterDisplay) displayCurrentPlayer(currentBatterForDisplay, true, DOM_ELEMENTS.mobileBatterDisplay);
        if (DOM_ELEMENTS.mobilePitcherDisplay) displayCurrentPlayer(currentPitcherForDisplay, false, DOM_ELEMENTS.mobilePitcherDisplay);
        if (DOM_ELEMENTS.awayCurrentPlayerDisplay) DOM_ELEMENTS.awayCurrentPlayerDisplay.innerHTML = '';
        if (DOM_ELEMENTS.homeCurrentPlayerDisplay) DOM_ELEMENTS.homeCurrentPlayerDisplay.innerHTML = '';
        if (DOM_ELEMENTS.awayTeamLineupList) DOM_ELEMENTS.awayTeamLineupList.innerHTML = '';
        if (DOM_ELEMENTS.homeTeamLineupList) DOM_ELEMENTS.homeTeamLineupList.innerHTML = '';
        if (DOM_ELEMENTS.awayTeamBullpenList) DOM_ELEMENTS.awayTeamBullpenList.innerHTML = '';
        if (DOM_ELEMENTS.homeTeamBullpenList) DOM_ELEMENTS.homeTeamBullpenList.innerHTML = '';
    } else { 
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
        displaySingleTeamLineupList('away', gameTeams, gameState.halfInning === 'top' ? currentBatterForDisplay : null);
        displaySingleTeamLineupList('home', gameTeams, gameState.halfInning === 'bottom' ? currentBatterForDisplay : null);
        displayTeamBullpen('away', gameTeams, currentPitcherForDisplay);
        displayTeamBullpen('home', gameTeams, currentPitcherForDisplay);

        if (DOM_ELEMENTS.mobileBatterDisplay) DOM_ELEMENTS.mobileBatterDisplay.innerHTML = '';
        if (DOM_ELEMENTS.mobilePitcherDisplay) DOM_ELEMENTS.mobilePitcherDisplay.innerHTML = '';
    }
}

function updateStandingsDisplay(teamRecords) {
    if (!teamRecords) return;
    if (DOM_ELEMENTS.awayTeamRecordSpan && teamRecords.away) {
        DOM_ELEMENTS.awayTeamRecordSpan.textContent = `(${teamRecords.away.wins}-${teamRecords.away.losses})`;
    }
    if (DOM_ELEMENTS.homeTeamRecordSpan && teamRecords.home) {
        DOM_ELEMENTS.homeTeamRecordSpan.textContent = `(${teamRecords.home.wins}-${teamRecords.home.losses})`;
    }
}

const eventKeywords = {
    'strikes out': 'strikeout', 'grounds out': 'out', 'flies out': 'out',
    'pops up': 'out', 'lines out': 'out', 'out': 'out', 'home run': 'homerun',
    'single': 'single', 'double': 'double', 'triple': 'triple', 'walk': 'walk'
};

export function updateOutcomeText(message, outcomeType) {
    if (!DOM_ELEMENTS.outcomeText) return;
    DOM_ELEMENTS.outcomeText.innerHTML = '';
    DOM_ELEMENTS.outcomeText.className = 'outcome-neutral';

    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;

    if (outcomeType && typeof outcomeType === 'string') {
        const generalClass = `outcome-${outcomeType.toLowerCase().replace(/_/g, '-')}`;
        messageSpan.classList.add(generalClass);
    }
    DOM_ELEMENTS.outcomeText.appendChild(messageSpan);
}
