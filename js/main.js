// js/main.js
import { loadData, TEAM_RECORDS_KEY, clearSavedData } from './storageUtils.js';
import { initialGameTeams, prepareTeamsData } from './playerUtils.js';
import { DOM_ELEMENTS, initializeUI, updateAllDisplays, updateOutcomeText } from './ui.js';
import { initializeGame, playNextAtBat, getGameState } from './gameLogic.js';

document.addEventListener('DOMContentLoaded', () => {
    // Load team W-L records for initial display
    const loadedTeamRecords = loadData(TEAM_RECORDS_KEY, {
        away: { name: initialGameTeams.away.name, wins: 0, losses: 0 },
        home: { name: initialGameTeams.home.name, wins: 0, losses: 0 }
    });

    // Prepare `currentTeamsData` by loading career stats into a fresh copy of `initialGameTeams`
    // This object will hold the live data for the current game session.
    let currentTeamsData = prepareTeamsData(initialGameTeams);

    // Initialize UI with the prepared team data and loaded W-L records
    initializeUI(currentTeamsData, loadedTeamRecords);

    // --- Simulation Control Variables ---
    let simInterval = null;
    let isSimulating = false;
    let pressTimer = null;
    const LONG_PRESS_DURATION = 400; // ms
    const SIM_INTERVAL_DELAY = 150;  // ms

    function runSingleSimulationStep() {
        const currentGameState = getGameState();
        if (currentGameState.gameOver || isSimulating) {
            stopContinuousSimulation();
            return false;
        }
        isSimulating = true;

        try {
            playNextAtBat(currentTeamsData); // Pass the live game data object
            const newState = getGameState(); // Get the updated game state
            // For standings, reload or use the initially loaded records.
            // If a game just ended, gameLogic's endGame would have updated and saved them.
            const latestRecords = loadData(TEAM_RECORDS_KEY, loadedTeamRecords); // Fallback to initially loaded
            updateAllDisplays(newState, currentTeamsData, latestRecords); // Pass ALL necessary data

            if (newState.gameOver) {
                stopContinuousSimulation();
                DOM_ELEMENTS.nextPlayButton.disabled = true;
                DOM_ELEMENTS.startGameButton.style.display = 'inline-block';
                return false;
            }
        } catch (error) {
            console.error("Error during simulation step:", error);
            stopContinuousSimulation();
            return false;
        } finally {
            isSimulating = false;
        }
        return true;
    }

    function startContinuousSimulation() {
        if (simInterval) return;
        console.log("Starting continuous simulation...");
        DOM_ELEMENTS.nextPlayButton.classList.add('simulating');
        simInterval = setInterval(() => {
            if (!runSingleSimulationStep()) {
                stopContinuousSimulation();
            }
        }, SIM_INTERVAL_DELAY);
    }

    function stopContinuousSimulation() {
        if (simInterval) {
            console.log("Stopping continuous simulation.");
            clearInterval(simInterval);
            simInterval = null;
        }
        isSimulating = false;
        DOM_ELEMENTS.nextPlayButton.classList.remove('simulating');
    }

    // --- Event Listeners ---
    DOM_ELEMENTS.startGameButton.addEventListener('click', () => {
        stopContinuousSimulation();

        // Prepare fresh team data for a new game (loads career stats, resets game stats, calculates OVRs)
        currentTeamsData = prepareTeamsData(initialGameTeams);

        initializeGame(currentTeamsData); // Initialize game state with this fresh data
        const currentGameState = getGameState();
        const latestRecords = loadData(TEAM_RECORDS_KEY, loadedTeamRecords);
        updateAllDisplays(currentGameState, currentTeamsData, latestRecords);

        DOM_ELEMENTS.startGameButton.style.display = 'none';
        DOM_ELEMENTS.nextPlayButton.style.display = 'inline-block';
        DOM_ELEMENTS.nextPlayButton.disabled = false;
        updateOutcomeText("Game started! Away team batting.", "GAME_EVENT");
    });

    DOM_ELEMENTS.nextPlayButton.addEventListener('click', () => {
        if (!pressTimer && !simInterval) {
            runSingleSimulationStep();
        }
    });

    DOM_ELEMENTS.nextPlayButton.addEventListener('mousedown', (e) => {
        if (getGameState().gameOver || simInterval) return;
        if (e.button !== 0) return;

        clearTimeout(pressTimer);
        pressTimer = setTimeout(() => {
            pressTimer = null;
            if (!getGameState().gameOver) {
                 startContinuousSimulation();
            }
        }, LONG_PRESS_DURATION);
    });

    DOM_ELEMENTS.nextPlayButton.addEventListener('mouseup', () => {
        clearTimeout(pressTimer);
        pressTimer = null;
        // If you want click-and-hold to sim then stop on release:
        // stopContinuousSimulation();
        // Otherwise, continuous sim stops on game over or mouse leave.
    });

    DOM_ELEMENTS.nextPlayButton.addEventListener('mouseleave', () => {
        clearTimeout(pressTimer);
        pressTimer = null;
        if (simInterval) {
            stopContinuousSimulation();
        }
    });

    DOM_ELEMENTS.nextPlayButton.addEventListener('contextmenu', (e) => e.preventDefault());

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
    resetButton.addEventListener('click', clearSavedData);
});
