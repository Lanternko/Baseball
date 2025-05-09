// js/playerUtils.js
import { CONFIG } from './config.js';
import { loadData, PLAYER_STATS_KEY } from './storageUtils.js';

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
  const w = CONFIG.ovrWeights.pitcher;
  const power     = p.power     ?? 5;
  const velocity  = p.velocity  ?? 5;
  const control   = p.control   ?? 5;
  const technique = p.technique ?? 5;
  const maxSta    = p.maxStamina ?? 70;

  // staminaScore 0~5 取決於 maxStamina (60 以下無加成)
  const staminaScore = Math.max(0, (maxSta - 60) / 40) * (10 * w.staminaEffect);

  const score =
    power     * w.power     +
    velocity  * w.velocity  +
    control   * w.control   +
    technique * w.technique +
    staminaScore;

  const ovr = Math.round(score * w.scale + w.base);
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
        p.gameHomeRuns = 0; // Game-specific HR
        p.atBatHistory = [];
        p.performanceString = '0-0';
        // Career stats (loaded or default to 0)
        p.careerAtBats = stats.careerAtBats || 0;
        p.careerHits = stats.careerHits || 0;
        p.careerHomeRuns = stats.careerHomeRuns || 0; // New career stat
        p.careerRunsBattedIn = stats.careerRunsBattedIn || 0;
    } else if (type === 'pitcher') {
        p.role       = stats.role || 'Reliever';
        p.power      = stats.power     ?? 5;
        p.velocity   = stats.velocity  ?? 5;
        p.control    = stats.control   ?? 5;
        p.technique  = stats.technique ?? 5;
        p.maxStamina = stats.maxStamina ?? (p.role === 'Starter' ? 100 : p.role === 'Reliever' ? 60 : 40);
        p.currentStamina = p.maxStamina;
        // Game-specific stats
        p.gameStrikeouts = 0; // Game-specific SO
        p.gameOutsRecorded = 0;
        p.gameRunsAllowed = 0;
        // Career stats
        p.careerOutsRecorded = stats.careerOutsRecorded || 0;
        p.careerRunsAllowed = stats.careerRunsAllowed || 0;
        p.careerStrikeouts = stats.careerStrikeouts || 0; // New career stat
        p.careerWins = stats.careerWins || 0;
        p.careerLosses = stats.careerLosses || 0;
        p.teamKeyOriginal = stats.teamKeyOriginal ?? null;
    }
    // Calculate OVR
    if (type === 'batter') p.ovr = calculateBatterOVR(p);
    else if (type === 'pitcher') p.ovr = calculatePitcherOVR(p);
    return p;
}

// Initial Team Data structure (example, ensure your actual data matches this structure for new stats)
export const initialGameTeams = {
  away: {
    name: 'Yankees',
    batters: [
      createPlayer('Aaron Judge', 'batter', { power: 10, hitRate: 8, contact: 7, speed: 6, careerHomeRuns: 0 }),
      createPlayer('Paul Goldschmidt', 'batter', { power: 8,  hitRate: 9, contact: 8, speed: 5, careerHomeRuns: 0 }),
      createPlayer('Trent Grisham',   'batter', { power: 6,  hitRate: 6, contact: 5, speed: 7, careerHomeRuns: 0 }),
      createPlayer('Anthony Volpe',   'batter', { power: 5,  hitRate: 7, contact: 7, speed: 9, careerHomeRuns: 0 }),
      createPlayer('Austin Wells',    'batter', { power: 7,  hitRate: 5, contact: 6, speed: 5, careerHomeRuns: 0 }),
      createPlayer('Ben Rice',        'batter', { power: 5,  hitRate: 6, contact: 6, speed: 6, careerHomeRuns: 0 }),
      createPlayer('Cody Bellinger',  'batter', { power: 7,  hitRate: 7, contact: 7, speed: 7, careerHomeRuns: 0 }),
      createPlayer('Gleyber Torres',  'batter', { power: 6,  hitRate: 7, contact: 7, speed: 6, careerHomeRuns: 0 }),
      createPlayer('Jasson Domínguez','batter', { power: 7,  hitRate: 6, contact: 5, speed: 8, careerHomeRuns: 0 })
    ],
    pitchers: {
      starter: createPlayer('Max Fried', 'pitcher', { role: 'Starter', power: 9, velocity: 8, control: 8, technique: 7, maxStamina: 95, careerStrikeouts: 0 }),
      reliever: createPlayer('Carlos Rodón', 'pitcher', { role: 'Reliever', power: 8, velocity: 7, control: 7, technique: 6, maxStamina: 75, careerStrikeouts: 0 }),
      closer: createPlayer('Devin Williams', 'pitcher', { role: 'Closer', power: 7, velocity: 8, control: 6, technique: 7, maxStamina: 45, careerStrikeouts: 0 })
    },
    scorePerInning: Array(CONFIG.innings).fill(0), totalRuns: 0, totalHits: 0, totalErrors: 0, currentBatterIndex: 0
  },
  home: {
    name: 'Dodgers',
    batters: [
      createPlayer('Shohei Ohtani', 'batter', { power: 9, hitRate: 9, contact: 8, speed: 8, careerHomeRuns: 0 }),
      createPlayer('Teoscar Hernández', 'batter', { power: 8, hitRate: 8, contact: 7, speed: 7, careerHomeRuns: 0 }),
      createPlayer('Freddie Freeman', 'batter', { power: 7, hitRate: 9, contact: 9, speed: 6, careerHomeRuns: 0 }),
      createPlayer('Mookie Betts', 'batter', { power: 8, hitRate: 8, contact: 8, speed: 9, careerHomeRuns: 0 }),
      createPlayer('Max Muncy', 'batter', { power: 7, hitRate: 7, contact: 6, speed: 5, careerHomeRuns: 0 }),
      createPlayer('Will Smith', 'batter', { power: 6, hitRate: 7, contact: 8, speed: 5, careerHomeRuns: 0 }),
      createPlayer('Gavin Lux', 'batter', { power: 5, hitRate: 6, contact: 7, speed: 7, careerHomeRuns: 0 }),
      createPlayer('James Outman', 'batter', { power: 7, hitRate: 5, contact: 5, speed: 8, careerHomeRuns: 0 }),
      createPlayer('Miguel Vargas', 'batter', { power: 5, hitRate: 6, contact: 7, speed: 6, careerHomeRuns: 0 })
    ],
    pitchers: {
      starter: createPlayer('Yoshinobu Yamamoto', 'pitcher', { role: 'Starter', power: 8, velocity: 9, control: 9, technique: 8, maxStamina: 100, careerStrikeouts: 0 }),
      reliever: createPlayer('Blake Treinen', 'pitcher', { role: 'Reliever', power: 7, velocity: 8, control: 7, technique: 6, maxStamina: 70, careerStrikeouts: 0 }),
      closer: createPlayer('Evan Phillips', 'pitcher', { role: 'Closer', power: 9, velocity: 9, control: 8, technique: 7, maxStamina: 50, careerStrikeouts: 0 })
    },
    scorePerInning: Array(CONFIG.innings).fill(0), totalRuns: 0, totalHits: 0, totalErrors: 0, currentBatterIndex: 0
  }
};

export function prepareTeamsData(baseTeamsStructure) {
    let workingTeamsData = JSON.parse(JSON.stringify(baseTeamsStructure));
    const savedPlayerStats = loadData(PLAYER_STATS_KEY);

    for (const teamKey in workingTeamsData) {
        const teamData = workingTeamsData[teamKey];
        if (teamData.batters && Array.isArray(teamData.batters)) {
            teamData.batters = teamData.batters.map(baseBatterStats => {
                let careerData = {};
                if (savedPlayerStats && savedPlayerStats[teamKey] && savedPlayerStats[teamKey].batters) {
                    const savedBatter = savedPlayerStats[teamKey].batters.find(sb => sb.name === baseBatterStats.name);
                    if (savedBatter) {
                        careerData = {
                            careerAtBats: savedBatter.careerAtBats || 0,
                            careerHits: savedBatter.careerHits || 0,
                            careerHomeRuns: savedBatter.careerHomeRuns || 0, // Load career HR
                            careerRunsBattedIn: savedBatter.careerRunsBattedIn || 0,
                        };
                    }
                }
                // Create player with merged base and career stats
                const player = createPlayer(baseBatterStats.name, 'batter', { ...baseBatterStats, ...careerData });
                // Reset game-specific stats explicitly after creation
                player.atBats = 0;
                player.hits = 0;
                player.runsBattedIn = 0;
                player.gameHomeRuns = 0;
                player.atBatHistory = [];
                player.performanceString = '0-0';
                return player;
            });
        }

        if (teamData.pitchers && typeof teamData.pitchers === 'object') {
            for (const role in teamData.pitchers) {
                const basePitcherStats = teamData.pitchers[role];
                if (basePitcherStats) {
                    let careerData = {};
                    if (savedPlayerStats && savedPlayerStats[teamKey] && savedPlayerStats[teamKey].pitchers && savedPlayerStats[teamKey].pitchers[role]) {
                         const savedPitcher = savedPlayerStats[teamKey].pitchers[role];
                         if (savedPitcher && basePitcherStats.name === savedPitcher.name) {
                            careerData = {
                                careerOutsRecorded: savedPitcher.careerOutsRecorded || 0,
                                careerRunsAllowed: savedPitcher.careerRunsAllowed || 0,
                                careerStrikeouts: savedPitcher.careerStrikeouts || 0, // Load career SO
                                careerWins: savedPitcher.careerWins || 0,
                                careerLosses: savedPitcher.careerLosses || 0,
                            };
                         }
                    }
                    // Create player with merged base and career stats
                    const player = createPlayer(basePitcherStats.name, 'pitcher', { ...basePitcherStats, ...careerData, role: basePitcherStats.role || role });
                    // Reset game-specific stats
                    player.currentStamina = player.maxStamina;
                    player.gameStrikeouts = 0;
                    player.gameOutsRecorded = 0;
                    player.gameRunsAllowed = 0;
                    teamData.pitchers[role] = player;
                }
            }
        }
        teamData.scorePerInning = Array(CONFIG.innings).fill(0);
        teamData.totalRuns = 0;
        teamData.totalHits = 0;
        teamData.totalErrors = 0;
        teamData.currentBatterIndex = 0;
    }
    return workingTeamsData;
}
