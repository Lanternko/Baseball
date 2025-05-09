// js/main.js
import { loadData, TEAM_RECORDS_KEY, PLAYER_STATS_KEY, clearSavedData } from './storageUtils.js';
import { initialGameTeams, prepareTeamsData } from './playerUtils.js';
import { DOM_ELEMENTS, initializeUI, updateAllDisplays, updateOutcomeText } from './ui.js';
import { initializeGame, playNextAtBat, getGameState, changeHalfInning, endGame } from './gameLogic.js';

document.addEventListener('DOMContentLoaded', () => {
    let currentTeamRecords = loadData(TEAM_RECORDS_KEY, {
        away: { name: initialGameTeams.away.name, wins: 0, losses: 0 },
        home: { name: initialGameTeams.home.name, wins: 0, losses: 0 }
    });
    let currentTeamsData = prepareTeamsData(initialGameTeams); // This loads initial career stats
    initializeUI(currentTeamsData, currentTeamRecords);

    let longPressSimInterval = null;
    let isLongPressSimulating = false; // For the "Next Batter" long press
    let isBatchSimulating = false; // For "Sim Inning", "Sim Game", "Sim 10 Games"
    let pressTimer = null;
    const LONG_PRESS_DURATION = 400;
    const SIM_INTERVAL_DELAY = 100;

    // --- Button State Management ---
    function disableGameControls(simulatingWhichButton = null) {
        isBatchSimulating = true; // General flag for any batch simulation
        DOM_ELEMENTS.nextPlayButton.disabled = true;
        if (DOM_ELEMENTS.simInningButton) DOM_ELEMENTS.simInningButton.disabled = true;
        if (DOM_ELEMENTS.simGameButton) DOM_ELEMENTS.simGameButton.disabled = true;
        // Sim 10 Games is special, it might re-enable itself if a single game sim is running
        if (DOM_ELEMENTS.sim10GamesButton) DOM_ELEMENTS.sim10GamesButton.disabled = true;


        if (simulatingWhichButton && DOM_ELEMENTS[simulatingWhichButton.id]) {
            DOM_ELEMENTS[simulatingWhichButton.id].classList.add('simulating');
            DOM_ELEMENTS[simulatingWhichButton.id].textContent = 'Simulating...';
        }
    }

    function enableGameControls(gameOver = false) {
        isBatchSimulating = false; // Reset general flag
        const originalButtonTexts = {
            nextPlayButton: 'Next Batter',
            simInningButton: 'Sim Inning',
            simGameButton: 'Sim Game',
            sim10GamesButton: 'Sim 10 Games'
        };

        if (DOM_ELEMENTS.nextPlayButton) {
            DOM_ELEMENTS.nextPlayButton.disabled = gameOver;
            DOM_ELEMENTS.nextPlayButton.classList.remove('simulating');
            DOM_ELEMENTS.nextPlayButton.textContent = originalButtonTexts.nextPlayButton;
        }
        if (DOM_ELEMENTS.simInningButton) {
            DOM_ELEMENTS.simInningButton.disabled = gameOver;
            DOM_ELEMENTS.simInningButton.classList.remove('simulating');
            DOM_ELEMENTS.simInningButton.textContent = originalButtonTexts.simInningButton;
        }
        if (DOM_ELEMENTS.simGameButton) {
            DOM_ELEMENTS.simGameButton.disabled = gameOver;
            DOM_ELEMENTS.simGameButton.classList.remove('simulating');
            DOM_ELEMENTS.simGameButton.textContent = originalButtonTexts.simGameButton;
        }
        // Sim 10 Games button can always be enabled if no other batch sim is running
        if (DOM_ELEMENTS.sim10GamesButton) {
            DOM_ELEMENTS.sim10GamesButton.disabled = false; 
            DOM_ELEMENTS.sim10GamesButton.classList.remove('simulating');
            DOM_ELEMENTS.sim10GamesButton.textContent = originalButtonTexts.sim10GamesButton;
        }

         if (gameOver) {
            if(DOM_ELEMENTS.simulationControlsContainer) DOM_ELEMENTS.simulationControlsContainer.style.display = 'none';
            if(DOM_ELEMENTS.nextPlayButton) DOM_ELEMENTS.nextPlayButton.style.display = 'none';
            if(DOM_ELEMENTS.startGameButton) DOM_ELEMENTS.startGameButton.style.display = 'inline-block';
        }
    }

    function runSinglePlayAndUpdate() {
        if (getGameState().gameOver) {
            stopLongPressSimulation();
            enableGameControls(true);
            return false;
        }
        isLongPressSimulating = true;
        try {
            playNextAtBat(currentTeamsData);
            const newState = getGameState();
            currentTeamRecords = loadData(TEAM_RECORDS_KEY, currentTeamRecords); // Refresh records
            updateAllDisplays(newState, currentTeamsData, currentTeamRecords);

            if (newState.gameOver) {
                stopLongPressSimulation();
                enableGameControls(true);
                return false;
            }
        } catch (error) {
            console.error("Error during simulation step:", error);
            stopLongPressSimulation();
            enableGameControls(getGameState().gameOver);
            return false;
        } finally {
            isLongPressSimulating = false;
        }
        return true;
    }

    function startLongPressSimulation() {
        if (longPressSimInterval || getGameState().gameOver || isBatchSimulating) return;
        isLongPressSimulating = true; // Set flag for long press
        disableGameControls(DOM_ELEMENTS.nextPlayButton);
        
        longPressSimInterval = setInterval(() => {
            if (!runSinglePlayAndUpdate()) {
                stopLongPressSimulation();
            }
        }, SIM_INTERVAL_DELAY);
    }

    function stopLongPressSimulation() {
        if (longPressSimInterval) {
            clearInterval(longPressSimInterval);
            longPressSimInterval = null;
        }
        isLongPressSimulating = false;
        if (!isBatchSimulating) { // Only enable if no other batch sim is running
            enableGameControls(getGameState().gameOver);
        }
    }

    // --- Event Listeners ---
    DOM_ELEMENTS.startGameButton.addEventListener('click', () => {
        stopLongPressSimulation();
        isBatchSimulating = false; // Ensure this is reset
        currentTeamsData = prepareTeamsData(initialGameTeams); // Load career stats
        currentTeamRecords = loadData(TEAM_RECORDS_KEY, { // Load W-L records
             away: { name: currentTeamsData.away.name, wins: 0, losses: 0 },
             home: { name: currentTeamsData.home.name, wins: 0, losses: 0 }
        });
        initializeGame(currentTeamsData); // Resets game-specific stats
        const currentGameState = getGameState();
        updateAllDisplays(currentGameState, currentTeamsData, currentTeamRecords);

        DOM_ELEMENTS.startGameButton.style.display = 'none';
        DOM_ELEMENTS.nextPlayButton.style.display = 'inline-block';
        if (DOM_ELEMENTS.simulationControlsContainer) {
            DOM_ELEMENTS.simulationControlsContainer.style.display = 'flex';
        }
        enableGameControls(false);
        updateOutcomeText("Game started! Away team batting.", "GAME_EVENT");
    });

    DOM_ELEMENTS.nextPlayButton.addEventListener('click', () => {
        if (!pressTimer && !longPressSimInterval && !isBatchSimulating) {
            runSinglePlayAndUpdate();
        }
    });

    DOM_ELEMENTS.nextPlayButton.addEventListener('mousedown', (e) => {
        if (getGameState().gameOver || longPressSimInterval || isBatchSimulating) return;
        if (e.button !== 0) return;
        clearTimeout(pressTimer);
        pressTimer = setTimeout(() => {
            pressTimer = null;
            if (!getGameState().gameOver) {
                 startLongPressSimulation();
            }
        }, LONG_PRESS_DURATION);
    });

    DOM_ELEMENTS.nextPlayButton.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
        pressTimer = null;
        stopLongPressSimulation();
    });

    DOM_ELEMENTS.nextPlayButton.addEventListener('mouseleave', () => {
        clearTimeout(pressTimer);
        pressTimer = null;
        if (longPressSimInterval) {
            stopLongPressSimulation();
        }
    });

    DOM_ELEMENTS.nextPlayButton.addEventListener('contextmenu', (e) => e.preventDefault());

    // --- Simulation Button Event Listeners ---
    if (DOM_ELEMENTS.simInningButton) {
        DOM_ELEMENTS.simInningButton.addEventListener('click', async () => {
            if (getGameState().gameOver || isLongPressSimulating || isBatchSimulating) return;

            disableGameControls(DOM_ELEMENTS.simInningButton);
            updateOutcomeText("Simulating current inning...", "GAME_EVENT");

            const initialInning = getGameState().currentInning;
            const initialHalf = getGameState().halfInning;
            
            await new Promise(resolve => {
                function simulateCurrentInningStep() {
                    let currentSimState = getGameState(); // Get fresh state each step
                    if (currentSimState.gameOver || 
                        ((currentSimState.currentInning !== initialInning || currentSimState.halfInning !== initialHalf) && currentSimState.outs === 0)) {
                        resolve();
                        return;
                    }
                    playNextAtBat(currentTeamsData);
                    if (!getGameState().gameOver) { // Check game over state from global after play
                        requestAnimationFrame(simulateCurrentInningStep);
                    } else {
                        resolve(); 
                    }
                }
                requestAnimationFrame(simulateCurrentInningStep);
            });
            
            const finalGameState = getGameState();
            currentTeamRecords = loadData(TEAM_RECORDS_KEY, currentTeamRecords);
            updateAllDisplays(finalGameState, currentTeamsData, currentTeamRecords);
            enableGameControls(finalGameState.gameOver);
            if (!finalGameState.gameOver) {
                 updateOutcomeText(`Inning ${initialInning} (${initialHalf}) simulation complete.`, "GAME_EVENT");
            }
        });
    }

    async function handleSimulateGame() {
        if (getGameState().gameOver || isLongPressSimulating || isBatchSimulating) return;

        disableGameControls(DOM_ELEMENTS.simGameButton);
        updateOutcomeText("Simulating current game...", "GAME_EVENT");

        await new Promise(resolve => {
            function simulateGameStep() {
                if (getGameState().gameOver) {
                    resolve();
                    return;
                }
                playNextAtBat(currentTeamsData);
                // No per-at-bat UI update for full game sim for speed
                requestAnimationFrame(simulateGameStep);
            }
            requestAnimationFrame(simulateGameStep);
        });

        const finalGameState = getGameState();
        currentTeamRecords = loadData(TEAM_RECORDS_KEY, currentTeamRecords); // Refresh records
        // currentTeamsData will have been updated by playNextAtBat -> processAtBatOutcome -> endGame (which saves player stats)
        // So, we re-prepare to load the latest career stats for display.
        currentTeamsData = prepareTeamsData(initialGameTeams); 
        updateAllDisplays(finalGameState, currentTeamsData, currentTeamRecords);
        enableGameControls(finalGameState.gameOver); // This will also hide sim buttons if game over
        // Outcome text is already updated by endGame
    }

    if (DOM_ELEMENTS.simGameButton) {
        DOM_ELEMENTS.simGameButton.addEventListener('click', handleSimulateGame);
    }

    async function handleSimulateMultipleGames(numberOfGames) {
        if (isLongPressSimulating || isBatchSimulating) return; // Prevent if any sim is active

        disableGameControls(DOM_ELEMENTS.sim10GamesButton);
        updateOutcomeText(`Simulating ${numberOfGames} games... Please wait.`, "GAME_EVENT");
        
        // Ensure the "Sim 10 Games" button itself shows "Simulating..."
        if (DOM_ELEMENTS.sim10GamesButton) {
             DOM_ELEMENTS.sim10GamesButton.classList.add('simulating');
             DOM_ELEMENTS.sim10GamesButton.textContent = 'Simulating...';
        }


        for (let i = 0; i < numberOfGames; i++) {
            // Prepare fresh team data for each new game, loading latest career stats from storage
            currentTeamsData = prepareTeamsData(initialGameTeams);
            initializeGame(currentTeamsData); // Resets game-specific stats (like stamina, game HR/SO)
            
            updateOutcomeText(`Simulating Game ${i + 1} of ${numberOfGames}...`, "GAME_EVENT_MINOR"); // Minor update

            // Silently simulate one full game
            while (!getGameState().gameOver) {
                playNextAtBat(currentTeamsData);
                // No UI updates within this inner loop for speed
            }
            // endGame is called by playNextAtBat when a game concludes,
            // which saves player career stats and team records to localStorage.
        }

        // After all games, load the final aggregated stats and records
        currentTeamsData = prepareTeamsData(initialGameTeams);
        currentTeamRecords = loadData(TEAM_RECORDS_KEY, currentTeamRecords);
        
        // Update UI once with the results of all simulated games
        // getGameState() will reflect the state of the very last game, which is fine.
        // The important part is that currentTeamsData (for career stats) and currentTeamRecords are up-to-date.
        updateAllDisplays(getGameState(), currentTeamsData, currentTeamRecords);
        enableGameControls(false); // Re-enable controls, game is not "over" in the context of starting a new one.
                                   // However, the specific game state IS over.
                                   // If the last game ended, the main game controls will be set appropriately by enableGameControls.
                                   // We specifically want sim 10 games to be available again.
        if (DOM_ELEMENTS.sim10GamesButton) { // Ensure sim 10 games button is re-enabled
            DOM_ELEMENTS.sim10GamesButton.disabled = false;
            DOM_ELEMENTS.sim10GamesButton.classList.remove('simulating');
            DOM_ELEMENTS.sim10GamesButton.textContent = 'Sim 10 Games';
        }
        updateOutcomeText(`${numberOfGames} games simulated. Check updated team records and player stats.`, "GAME_EVENT");
    }


    if (DOM_ELEMENTS.sim10GamesButton) {
        DOM_ELEMENTS.sim10GamesButton.addEventListener('click', () => handleSimulateMultipleGames(10));
    }

    // Optional: Reset Button
    const resetButton = document.createElement('button');
    resetButton.id = 'resetDataButton';
    resetButton.textContent = 'Reset All Saved Stats';
    resetButton.style.position = 'fixed';
    resetButton.style.top = '10px';
    resetButton.style.right = '10px';
    resetButton.style.zIndex = '1000';
    resetButton.style.padding = '8px 12px';
    resetButton.style.backgroundColor = '#f44336';
    resetButton.style.color = 'white';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '4px';
    resetButton.style.cursor = 'pointer';
    resetButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    document.body.appendChild(resetButton);
    resetButton.addEventListener('click', () => {
        if (confirm("Are you sure you want to reset ALL saved player stats and team records? This cannot be undone.")) {
            clearSavedData(); // This now reloads the page
        }
    });
});
