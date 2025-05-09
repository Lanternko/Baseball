// js/playerUtils.js
import { CONFIG } from './config.js';
import { loadData, PLAYER_STATS_KEY } from './storageUtils.js'; // Ensure this import is correct

// OVR Calculation Functions
function calculateBatterOVR(batter) {
    const w = CONFIG.ovrWeights.batter;
    const power   = batter.power   ?? 5;
    const hitRate = batter.hitRate ?? 5;
    const contact = batter.contact ?? 5;
    const speed   = batter.speed   ?? 5;
    const score = power * w.power + hitRate * w.hitRate + contact * w.contact + speed * w.speed;
    const ovr = Math.round(score * w.scale + w.base);
    return Math.min(99, Math.max(40, ovr));
}

function calculatePitcherOVR(p) {
    const power     = p.power     ?? 5;
    const velocity  = p.velocity  ?? 5;
    const control   = p.control   ?? 5;
    const technique = p.technique ?? 5;
    const maxSta    = p.maxStamina ?? 70;
    const staBonus = Math.max(0, (maxSta - 50) / 10) * 1.5; // Example: 50 stamina = 0 bonus, 100 stamina = 7.5 bonus
    const diffScore = (power - 5) * 4 + (velocity - 5) * 4 + (control - 5) * 3 + (technique - 5) * 2 + staBonus;
    const base = 50; // Assuming 50 is the OVR for an all-5 stats pitcher before stamina bonus
    const ovr  = Math.round(base + diffScore);
    return Math.min(99, Math.max(40, ovr));
}

// Player Object Factory
export function createPlayer(name, type, stats = {}) {
    const p = { name, type };
    if (type === 'batter') {
        p.power   = stats.power   ?? 5;
        p.hitRate = stats.hitRate ?? 5;
        p.contact = stats.contact ?? 5;
        p.speed   = stats.speed   ?? 5;
        // Game-specific stats (reset each game)
        p.atBats = 0;
        p.hits = 0;
        p.runsBattedIn = 0;
        p.atBatHistory = [];
        p.performanceString = '0-0';
        // Career stats (loaded or default to 0)
        p.careerAtBats = stats.careerAtBats || 0;
        p.careerHits = stats.careerHits || 0;
    } else if (type === 'pitcher') {
        p.role       = stats.role || 'Reliever'; // Default role
        p.power      = stats.power     ?? 5;    // Pitcher's "stuff" or general power
        p.velocity   = stats.velocity  ?? 5;
        p.control    = stats.control   ?? 5;
        p.technique  = stats.technique ?? 5;    // Ability to hit spots, command, etc.
        p.maxStamina = stats.maxStamina ?? (p.role === 'Starter' ? 100 : p.role === 'Reliever' ? 60 : 40);
        p.currentStamina = p.maxStamina;
        // Career stats
        p.careerOutsRecorded = stats.careerOutsRecorded || 0;
        p.careerRunsAllowed = stats.careerRunsAllowed || 0; // Or earned runs if you track errors
        p.careerWins = stats.careerWins || 0; // Pitcher wins are complex, not fully implemented here
        p.careerLosses = stats.careerLosses || 0; // Pitcher losses are complex
        p.teamKeyOriginal = stats.teamKeyOriginal ?? null;
    }
    // Calculate OVR (should be done after all base stats are set)
    if (type === 'batter') p.ovr = calculateBatterOVR(p);
    else if (type === 'pitcher') p.ovr = calculatePitcherOVR(p);
    return p;
}

// Initial Team Data structure
export const initialGameTeams = {
  away: {
    name: 'Yankees',
    batters: [
      createPlayer('Aaron Judge', 'batter', { power: 10, hitRate: 8, contact: 7, speed: 6 }),
      createPlayer('Paul Goldschmidt', 'batter', { power: 8,  hitRate: 9, contact: 8, speed: 5 }),
      createPlayer('Trent Grisham',   'batter', { power: 6,  hitRate: 6, contact: 5, speed: 7 }),
      createPlayer('Anthony Volpe',   'batter', { power: 5,  hitRate: 7, contact: 7, speed: 9 }),
      createPlayer('Austin Wells',    'batter', { power: 7,  hitRate: 5, contact: 6, speed: 5 }),
      createPlayer('Ben Rice',        'batter', { power: 5,  hitRate: 6, contact: 6, speed: 6 }),
      createPlayer('Cody Bellinger',  'batter', { power: 7,  hitRate: 7, contact: 7, speed: 7 }),
      createPlayer('Gleyber Torres',  'batter', { power: 6,  hitRate: 7, contact: 7, speed: 6 }),
      createPlayer('Jasson Domínguez','batter', { power: 7,  hitRate: 6, contact: 5, speed: 8 })
    ],
    pitchers: {
      starter: createPlayer('Max Fried', 'pitcher', { role: 'Starter', power: 9, velocity: 8, control: 8, technique: 7, maxStamina: 95 }),
      reliever: createPlayer('Carlos Rodón', 'pitcher', { role: 'Reliever', power: 8, velocity: 7, control: 7, technique: 6, maxStamina: 75 }),
      closer: createPlayer('Devin Williams', 'pitcher', { role: 'Closer', power: 7, velocity: 8, control: 6, technique: 7, maxStamina: 45 })
    },
    scorePerInning: Array(CONFIG.innings).fill(0), totalRuns: 0, totalHits: 0, totalErrors: 0, currentBatterIndex: 0
  },
  home: {
    name: 'Dodgers',
    batters: [
      createPlayer('Shohei Ohtani', 'batter', { power: 9, hitRate: 9, contact: 8, speed: 8 }),
      createPlayer('Teoscar Hernández', 'batter', { power: 8, hitRate: 8, contact: 7, speed: 7 }),
      createPlayer('Freddie Freeman', 'batter', { power: 7, hitRate: 9, contact: 9, speed: 6 }),
      createPlayer('Mookie Betts', 'batter', { power: 8, hitRate: 8, contact: 8, speed: 9 }),
      createPlayer('Max Muncy', 'batter', { power: 7, hitRate: 7, contact: 6, speed: 5 }),
      createPlayer('Will Smith', 'batter', { power: 6, hitRate: 7, contact: 8, speed: 5 }),
      createPlayer('Gavin Lux', 'batter', { power: 5, hitRate: 6, contact: 7, speed: 7 }),
      createPlayer('James Outman', 'batter', { power: 7, hitRate: 5, contact: 5, speed: 8 }),
      createPlayer('Miguel Vargas', 'batter', { power: 5, hitRate: 6, contact: 7, speed: 6 })
    ],
    pitchers: {
      starter: createPlayer('Yoshinobu Yamamoto', 'pitcher', { role: 'Starter', power: 8, velocity: 9, control: 9, technique: 8, maxStamina: 100 }),
      reliever: createPlayer('Blake Treinen', 'pitcher', { role: 'Reliever', power: 7, velocity: 8, control: 7, technique: 6, maxStamina: 70 }),
      closer: createPlayer('Evan Phillips', 'pitcher', { role: 'Closer', power: 9, velocity: 9, control: 8, technique: 7, maxStamina: 50 })
    },
    scorePerInning: Array(CONFIG.innings).fill(0), totalRuns: 0, totalHits: 0, totalErrors: 0, currentBatterIndex: 0
  }
};

// Prepares team data: creates players, loads career stats, calculates OVRs, and resets game-specific stats.
export function prepareTeamsData(baseTeamsStructure) {
    // Create a deep copy from the base structure to ensure fresh player objects for each game preparation
    let workingTeamsData = JSON.parse(JSON.stringify(baseTeamsStructure));
    const savedPlayerStats = loadData(PLAYER_STATS_KEY);

    // Re-create player objects to ensure methods and correct prototype chain, then merge saved stats
    for (const teamKey in workingTeamsData) {
        const teamData = workingTeamsData[teamKey];
        // Re-create batters and merge saved stats
        if (teamData.batters && Array.isArray(teamData.batters)) {
            teamData.batters = teamData.batters.map(baseBatterStats => {
                let careerData = {};
                if (savedPlayerStats && savedPlayerStats[teamKey] && savedPlayerStats[teamKey].batters) {
                    const savedBatter = savedPlayerStats[teamKey].batters.find(sb => sb.name === baseBatterStats.name);
                    if (savedBatter) {
                        careerData = {
                            careerAtBats: savedBatter.careerAtBats || 0,
                            careerHits: savedBatter.careerHits || 0,
                            // Add other career stats here
                        };
                    }
                }
                return createPlayer(baseBatterStats.name, 'batter', { ...baseBatterStats, ...careerData });
            });
        }

        // Re-create pitchers and merge saved stats
        if (teamData.pitchers && typeof teamData.pitchers === 'object') {
            for (const role in teamData.pitchers) {
                const basePitcherStats = teamData.pitchers[role];
                if (basePitcherStats) {
                    let careerData = {};
                    if (savedPlayerStats && savedPlayerStats[teamKey] && savedPlayerStats[teamKey].pitchers && savedPlayerStats[teamKey].pitchers[role]) {
                         const savedPitcher = savedPlayerStats[teamKey].pitchers[role];
                         // Ensure names match if the structure is based on roles being unique identifiers for saved data
                         if (savedPitcher && basePitcherStats.name === savedPitcher.name) {
                            careerData = {
                                careerOutsRecorded: savedPitcher.careerOutsRecorded || 0,
                                careerRunsAllowed: savedPitcher.careerRunsAllowed || 0,
                                // Add other career stats
                            };
                         }
                    }
                    teamData.pitchers[role] = createPlayer(basePitcherStats.name, 'pitcher', { ...basePitcherStats, ...careerData, role: basePitcherStats.role || role });
                }
            }
        }
        // Reset game-specific team stats
        teamData.scorePerInning = Array(CONFIG.innings).fill(0);
        teamData.totalRuns = 0;
        teamData.totalHits = 0;
        teamData.totalErrors = 0;
        teamData.currentBatterIndex = 0;
    }
    return workingTeamsData;
}
