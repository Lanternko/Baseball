import { CONFIG } from './config.js';
import { loadData, PLAYER_STATS_KEY } from './storageUtils.js';
import { ALL_TEAMS, getTeamById as getBaseTeamById } from './teamsdata.js';

// 🔥 ADVANCED OVR CALCULATION using Baseball_algo models
function calculateBatterOVR(batter) {
    // Convert batter attributes to POW/HIT/EYE system
    const pow = batter.power || 50;
    const hit = batter.hitRate || 50;
    const eye = batter.contact || 50; // Using contact as EYE proxy
    
    // Use advanced OVR calculation if available
    if (typeof window !== 'undefined' && typeof window.calculateBatterOVR === 'function') {
        try {
            const result = window.calculateBatterOVR(pow, hit, eye);
            return result.ovr || fallbackCalculateBatterOVR(batter);
        } catch (error) {
            console.warn('Advanced OVR calculation failed, using fallback:', error);
            return fallbackCalculateBatterOVR(batter);
        }
    }
    
    // Fallback to old calculation method
    return fallbackCalculateBatterOVR(batter);
}

// Fallback OVR calculation (original method)
function fallbackCalculateBatterOVR(batter) {
    const w = CONFIG.ovrWeights.batter;
    const power   = (batter.power   ?? 50);
    const hitRate = (batter.hitRate ?? 50);
    const contact = (batter.contact ?? 50);
    const speed   = (batter.speed   ?? 50);
    const score = power * w.power + hitRate * w.hitRate + contact * w.contact + speed * w.speed;
    const ovr = Math.round(score * w.scale + w.base);
    return Math.min(99, Math.max(40, ovr));
}

function calculatePitcherOVR(p) {
  const w = CONFIG.ovrWeights.pitcher;
  const power     = p.power     ?? 50;
  const velocity  = p.velocity  ?? 50;
  const control   = p.control   ?? 50;
  const technique = p.technique ?? 50;
  const maxSta    = p.maxStamina ?? 70;
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

export function createPlayer(name, type, baseStats = {}, careerStats = {}, teamId = null) {
    const p = { name, type, teamId };
    Object.assign(p, baseStats);

    if (type === 'batter') {
        p.careerAtBats = careerStats.careerAtBats || 0;
        p.careerHits = careerStats.careerHits || 0;
        p.careerHomeRuns = careerStats.careerHomeRuns || 0;
        p.careerRunsBattedIn = careerStats.careerRunsBattedIn || 0;
        p.atBats = 0;
        p.hits = 0;
        p.runsBattedIn = 0;
        p.gameHomeRuns = 0;
        p.atBatHistory = [];
        p.performanceString = '0-0';
    } else if (type === 'pitcher') {
        p.role = baseStats.role || 'Reliever'; // role 來自 baseStats
        p.maxStamina = baseStats.maxStamina ?? (p.role === 'Starter' ? 100 : p.role === 'Reliever' ? 60 : 40);
        p.careerOutsRecorded = careerStats.careerOutsRecorded || 0;
        p.careerRunsAllowed = careerStats.careerRunsAllowed || 0;
        p.careerStrikeouts = careerStats.careerStrikeouts || 0;
        p.careerWins = careerStats.careerWins || 0;
        p.careerLosses = careerStats.careerLosses || 0;
        p.currentStamina = p.maxStamina;
        p.gameStrikeouts = 0;
        p.gameOutsRecorded = 0;
        p.gameRunsAllowed = 0;
    }

    if (type === 'batter') p.ovr = calculateBatterOVR(p);
    else if (type === 'pitcher') p.ovr = calculatePitcherOVR(p);
    return p;
}

export function prepareTeamsData(awayTeamId, homeTeamId) {
    const allSavedPlayerStats = loadData(PLAYER_STATS_KEY, {});

    const structureTeam = (teamId) => {
        const baseTeamData = getBaseTeamById(teamId);
        if (!baseTeamData) {
            console.error(`Team with ID "${teamId}" not found in teamsData.js`);
            return { id: teamId, name: `Unknown Team (${teamId})`, batters: [], pitchers: { startersRotation: [], reliever: null, closer: null }, scorePerInning: Array(CONFIG.innings).fill(0), totalRuns: 0, totalHits: 0, totalErrors: 0, currentBatterIndex: 0 };
        }

        // PLAYER_STATS_KEY 結構: { teamId: { players: { "Player Name1": {careerStats...}, "Player Name2": ... } } }
        const teamPlayerSavedStats = allSavedPlayerStats[teamId]?.players || {};

        const processedBatters = baseTeamData.batters.map(baseBatterInfo => {
            const savedBatterCareerStats = teamPlayerSavedStats[baseBatterInfo.name] || {};
            return createPlayer(baseBatterInfo.name, 'batter', baseBatterInfo.stats, savedBatterCareerStats, teamId);
        });

        const processedPitchers = {
            startersRotation: [],
            reliever: null,
            closer: null
        };

        // 處理先發投手輪值
        if (baseTeamData.pitchers.startersRotation && Array.isArray(baseTeamData.pitchers.startersRotation)) {
            processedPitchers.startersRotation = baseTeamData.pitchers.startersRotation.map(baseStarterInfo => {
                const savedStarterCareerStats = teamPlayerSavedStats[baseStarterInfo.name] || {};
                // 確保 role 是 'Starter'
                const starterBaseStats = { ...baseStarterInfo.stats, role: 'Starter' };
                return createPlayer(baseStarterInfo.name, 'pitcher', starterBaseStats, savedStarterCareerStats, teamId);
            });
        }

        // 處理牛棚投手 (中繼和終結者)
        ['reliever', 'closer'].forEach(role => {
            const basePitcherInfo = baseTeamData.pitchers[role];
            if (basePitcherInfo) {
                const savedPitcherCareerStats = teamPlayerSavedStats[basePitcherInfo.name] || {};
                 // 確保 role 正確
                const pitcherBaseStats = { ...basePitcherInfo.stats, role: basePitcherInfo.stats.role || role.charAt(0).toUpperCase() + role.slice(1) };
                processedPitchers[role] = createPlayer(basePitcherInfo.name, 'pitcher', pitcherBaseStats, savedPitcherCareerStats, teamId);
            }
        });

        return {
            id: baseTeamData.id,
            name: baseTeamData.name,
            batters: processedBatters,
            pitchers: processedPitchers, // 現在包含 startersRotation 陣列
            scorePerInning: Array(CONFIG.innings).fill(0),
            totalRuns: 0,
            totalHits: 0,
            totalErrors: 0,
            currentBatterIndex: 0
        };
    };

    return {
        away: structureTeam(awayTeamId),
        home: structureTeam(homeTeamId)
    };
}

export function getDefaultTeamIds() {
    const awayId = ALL_TEAMS.length > 0 ? ALL_TEAMS[0].id : "NYY"; // 預設為 NYY
    const homeId = ALL_TEAMS.length > 1 ? ALL_TEAMS[1].id : "LAD"; // 預設為 LAD
    return { awayTeamId: awayId, homeTeamId: homeId };
}