import { CONFIG } from './config.js';

// ─────────────────────────────────────────────────────────────────────────────
// OVR 計算函式
// ─────────────────────────────────────────────────────────────────────────────
function calculateBatterOVR(batter) {
    const w = CONFIG.ovrWeights.batter;
    const power   = batter.power   ?? 5;
    const hitRate = batter.hitRate ?? 5;
    const contact = batter.contact ?? 5;
    const speed   = batter.speed   ?? 5;
  
    const score =
      power   * w.power   +
      hitRate * w.hitRate +
      contact * w.contact +
      speed   * w.speed;
  
    const ovr = Math.round(score * w.scale + w.base);
    return Math.min(99, Math.max(40, ovr));
  }
  
  // ── Pitcher OVR：改用「差值 × 權重」以拉大分佈 ──
  function calculatePitcherOVR(p) {
    // 個別能力（1‑10），以 5 為平均
    const power     = p.power     ?? 5;
    const velocity  = p.velocity  ?? 5;
    const control   = p.control   ?? 5;
    const technique = p.technique ?? 5;
    const maxSta    = p.maxStamina ?? 70;
  
    // stamina 轉換成 0‑7.5 區間的加分
    const staBonus = Math.max(0, (maxSta - 50) / 10) * 1.5; // 50→0 分，100→7.5 分
  
    // 每項差 1 點 → OVR 漲 (權重) 點
    const diffScore =
        (power     - 5) * 4 +
        (velocity  - 5) * 4 +
        (control   - 5) * 3 +
        (technique - 5) * 2 +
        staBonus;
  
    const base = 50; // 全屬性 = 5 時即 50 OVR
    const ovr  = Math.round(base + diffScore);
    return Math.min(99, Math.max(40, ovr));
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // Player 物件工廠
  // ─────────────────────────────────────────────────────────────────────────────
  export function createPlayer(name, type, stats = {}) {
    const p = { name, type };
  
    if (type === 'batter') {
      p.power   = stats.power   ?? 5;
      p.hitRate = stats.hitRate ?? 5;
      p.contact = stats.contact ?? 5;
      p.speed   = stats.speed   ?? 5;
      p.atBats = p.hits = p.runsBattedIn = 0;
      p.atBatHistory = [];
      p.performanceString = '0-0';
    } else if (type === 'pitcher') {
      p.role       = stats.role || 'Reliever';
      p.power      = stats.power     ?? 5;
      p.velocity   = stats.velocity  ?? 5;
      p.control    = stats.control   ?? 5;
      p.technique  = stats.technique ?? 5;
      p.maxStamina = stats.maxStamina ?? (p.role === 'Starter' ? 100 : p.role === 'Reliever' ? 60 : 40);
      p.currentStamina = p.maxStamina;
      p.teamKeyOriginal = stats.teamKeyOriginal ?? null;
    }
  
    return p;
  }

// ─────────────────────────────────────────────────────────────────────────────
// Teams 初始資料
// ─────────────────────────────────────────────────────────────────────────────
export const gameTeams = {
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
      starter: createPlayer('Max Fried', 'pitcher', {
        role: 'Starter', power: 9, velocity: 8, control: 8, technique: 7, maxStamina: 95
      }),
      reliever: createPlayer('Carlos Rodón', 'pitcher', {
        role: 'Reliever', power: 8, velocity: 7, control: 7, technique: 6, maxStamina: 75
      }),
      closer: createPlayer('Devin Williams', 'pitcher', {
        role: 'Closer', power: 7, velocity: 8, control: 6, technique: 7, maxStamina: 45
      })
    },
    scorePerInning: Array(CONFIG.innings).fill(0),
    totalRuns: 0,
    totalHits: 0,
    totalErrors: 0,
    currentBatterIndex: 0
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
      starter: createPlayer('Yoshinobu Yamamoto', 'pitcher', {
        role: 'Starter', power: 8, velocity: 9, control: 9, technique: 8, maxStamina: 100
      }),
      reliever: createPlayer('Blake Treinen', 'pitcher', {
        role: 'Reliever', power: 7, velocity: 8, control: 7, technique: 6, maxStamina: 70
      }),
      closer: createPlayer('Evan Phillips', 'pitcher', {
        role: 'Closer', power: 9, velocity: 9, control: 8, technique: 7, maxStamina: 50
      })
    },
    scorePerInning: Array(CONFIG.innings).fill(0),
    totalRuns: 0,
    totalHits: 0,
    totalErrors: 0,
    currentBatterIndex: 0
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// OVR & 初始狀態計算
// ─────────────────────────────────────────────────────────────────────────────
export function initializePlayerStats(teams) {
    for (const key in teams) {
      const t = teams[key];
  
      t.batters?.forEach(b => {
        b.ovr = calculateBatterOVR(b);
        b.atBats = b.hits = b.runsBattedIn = 0;
        b.atBatHistory = [];
        b.performanceString = '0-0';
      });
  
      if (t.pitchers) {
        Object.values(t.pitchers).forEach(p => {
          if (p) {
            p.teamKeyOriginal = key;
            p.ovr = calculatePitcherOVR(p);
          }
        });
      }
    }
  }
  