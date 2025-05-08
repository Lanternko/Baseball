// js/main.js
import { gameTeams, initializePlayerStats } from './playerUtils.js';
import { DOM_ELEMENTS, initializeUI, updateAllDisplays, updateOutcomeText } from './ui.js';
import { initializeGame, playNextAtBat, getGameState } from './gameLogic.js';

document.addEventListener('DOMContentLoaded', () => {
    initializePlayerStats(gameTeams);
    initializeUI(gameTeams);

    let simInterval = null;
    let isSimulating = false;
    let pressTimer = null;
    const LONG_PRESS_DURATION = 400; // ms to hold for continuous sim
    const SIM_INTERVAL_DELAY = 150; // ms between simulated plays

    function runSingleSimulationStep() {
        const currentGameState = getGameState();
        if (currentGameState.gameOver || isSimulating) {
            stopContinuousSimulation();
            return false; // Indicate simulation should stop
        }
        isSimulating = true;

        try {
            playNextAtBat(gameTeams);
            const newState = getGameState(); // Get state *after* play
            updateAllDisplays(newState, gameTeams);

            if (newState.gameOver) {
                stopContinuousSimulation();
                DOM_ELEMENTS.nextPlayButton.disabled = true;
                DOM_ELEMENTS.startGameButton.style.display = 'inline-block';
                return false; // Indicate simulation should stop
            }
        } catch (error) {
            console.error("Error during simulation step:", error);
            stopContinuousSimulation();
            return false; // Indicate simulation should stop
        } finally {
             isSimulating = false;
        }
        return true; // Indicate simulation can continue
    }

    function startContinuousSimulation() {
        if (simInterval) return;
        console.log("Starting continuous simulation...");
        DOM_ELEMENTS.nextPlayButton.classList.add('simulating');
        // Run steps using interval
        simInterval = setInterval(() => {
            const canContinue = runSingleSimulationStep();
            if (!canContinue) {
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
        initializeGame(gameTeams);
        const currentGameState = getGameState();
        updateAllDisplays(currentGameState, gameTeams);
        DOM_ELEMENTS.startGameButton.style.display = 'none';
        DOM_ELEMENTS.nextPlayButton.style.display = 'inline-block';
        DOM_ELEMENTS.nextPlayButton.disabled = false;
        updateOutcomeText("Game started! Away team batting.", "GAME_EVENT");
    });

    // Single Click
    DOM_ELEMENTS.nextPlayButton.addEventListener('click', () => {
        // Only run single step if not currently holding down for long press
        if (!pressTimer && !simInterval) {
            runSingleSimulationStep();
        }
    });

    // Long Press Start
    DOM_ELEMENTS.nextPlayButton.addEventListener('mousedown', (e) => {
        if (getGameState().gameOver || simInterval) return; // Don't start if game over or already simulating
        // Prevent starting if it wasn't a left click
        if (e.button !== 0) return;

        // Clear any previous timer
        clearTimeout(pressTimer);
        // Start a new timer
        pressTimer = setTimeout(() => {
            pressTimer = null; // Timer has fired, clear it
            if (!getGameState().gameOver) {
                 startContinuousSimulation();
            }
        }, LONG_PRESS_DURATION);
    });

    // Long Press End / Mouse Up
    DOM_ELEMENTS.nextPlayButton.addEventListener('mouseup', () => {
        clearTimeout(pressTimer); // Cancel timer if released before it fires
        pressTimer = null;
        stopContinuousSimulation(); // Always stop sim on mouse up
    });

    // Mouse Leave safety
    DOM_ELEMENTS.nextPlayButton.addEventListener('mouseleave', () => {
        clearTimeout(pressTimer);
        pressTimer = null;
        // Stop simulating if mouse leaves while button is held
        if (simInterval) {
            stopContinuousSimulation();
        }
    });

     // Prevent context menu on long press
    DOM_ELEMENTS.nextPlayButton.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

});
