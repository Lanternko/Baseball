// probability_model.js - 簡化直觀的棒球模擬系統
// 設計理念: HIT→安打, POW→XBH, EYE→BB+接觸加成

console.log('⚾ 載入簡化模擬引擎...');

// 載入常數表 - Browser environment compatibility
let EYE_BB_RATE_TABLE, EYE_CONTACT_BONUS_TABLE, HIT_CONTACT_RATE_TABLE, 
    HIT_SUCCESS_RATE_TABLE, POW_XBH_RATE_TABLE, POW_HR_RATIO_TABLE, interpolate;

if (typeof module !== 'undefined' && module.exports) {
  // Node.js 環境
  const constants = require('./shared_constants.js');
  ({
    EYE_BB_RATE_TABLE,
    EYE_CONTACT_BONUS_TABLE,
    HIT_CONTACT_RATE_TABLE,
    HIT_SUCCESS_RATE_TABLE,
    POW_XBH_RATE_TABLE,
    POW_HR_RATIO_TABLE,
    interpolate
  } = constants);
  
  // 設定全域變數供函數使用
  global.EYE_BB_RATE_TABLE = EYE_BB_RATE_TABLE;
  global.EYE_CONTACT_BONUS_TABLE = EYE_CONTACT_BONUS_TABLE;
  global.HIT_CONTACT_RATE_TABLE = HIT_CONTACT_RATE_TABLE;
  global.HIT_SUCCESS_RATE_TABLE = HIT_SUCCESS_RATE_TABLE;
  global.POW_XBH_RATE_TABLE = POW_XBH_RATE_TABLE;
  global.POW_HR_RATIO_TABLE = POW_HR_RATIO_TABLE;
  global.interpolate = interpolate;
} else if (typeof window !== 'undefined') {
  // 瀏覽器環境：從全域變數獲取常數表
  if (typeof window.interpolate === 'undefined') {
    console.error('❌ 請先載入 shared_constants.js');
    throw new Error('shared_constants.js must be loaded before shared_probability_model.js');
  }
  
  EYE_BB_RATE_TABLE = window.EYE_BB_RATE_TABLE;
  EYE_CONTACT_BONUS_TABLE = window.EYE_CONTACT_BONUS_TABLE;
  HIT_CONTACT_RATE_TABLE = window.HIT_CONTACT_RATE_TABLE;
  HIT_SUCCESS_RATE_TABLE = window.HIT_SUCCESS_RATE_TABLE;
  POW_XBH_RATE_TABLE = window.POW_XBH_RATE_TABLE;
  POW_HR_RATIO_TABLE = window.POW_HR_RATIO_TABLE;
  interpolate = window.interpolate;
}

// ====================================
// 🚀 簡化模擬引擎
// ====================================

// 🎯 新的簡化模擬函數
function simulateSimpleAtBat(EYE, HIT, POW, random1, random2, random3, random4) {
  // === 第一步：保送檢查 ===
  const bbRate = interpolate(EYE, EYE_BB_RATE_TABLE);
  if (random1 < bbRate) {
    return 'BB';
  }
  
  // === 第二步：接觸檢查 (HIT基礎 + EYE小幅加成) ===
  const baseContactRate = interpolate(HIT, HIT_CONTACT_RATE_TABLE);
  const eyeContactBonus = interpolate(EYE, EYE_CONTACT_BONUS_TABLE);
  const finalContactRate = Math.min(0.99, baseContactRate + eyeContactBonus);
  
  // 調整接觸門檻（考慮保送後的剩餘機率空間）
  const remainingProbability = 1 - bbRate;
  const contactThreshold = bbRate + (remainingProbability * finalContactRate);
  
  if (random1 >= contactThreshold) {
    return 'K'; // 揮空三振
  }
  
  // === 第三步：安打檢查 (基於接觸) ===
  const hitSuccessRate = interpolate(HIT, HIT_SUCCESS_RATE_TABLE);
  if (random2 >= hitSuccessRate) {
    return 'OUT'; // 接觸但未成安打
  }
  
  // === 第四步：長打檢查 (基於安打) ===
  const xbhRate = interpolate(POW, POW_XBH_RATE_TABLE);
  if (random3 >= xbhRate) {
    return '1B'; // 一壘安打
  }
  
  // === 第五步：HR vs 2B分配 ===
  const hrRatio = interpolate(POW, POW_HR_RATIO_TABLE);
  return random4 < hrRatio ? 'HR' : '2B';
}

// 批量模擬函數
function simulateSimpleMultipleBats(EYE, HIT, POW, numAtBats = 600) {
  const results = {
    BB: 0, K: 0, HR: 0, '2B': 0, '1B': 0, OUT: 0
  };
  
  for (let i = 0; i < numAtBats; i++) {
    const outcome = simulateSimpleAtBat(
      EYE, HIT, POW, 
      Math.random(), Math.random(), Math.random(), Math.random()
    );
    results[outcome]++;
  }
  
  return results;
}

// 統一的批量模擬函數 (向下相容)
function simulateMultipleAtBats(EYE, HIT, POW, numAtBats = 600) {
  return simulateSimpleMultipleBats(EYE, HIT, POW, numAtBats);
}

// 統一的單球模擬函數 (向下相容)
function simulateAtBat(EYE, HIT, POW, random1, random2, random3, random4) {
  return simulateSimpleAtBat(EYE, HIT, POW, random1, random2, random3, random4);
}

// 統計數據計算
function calculateSimpleStats(simulationResults, pa = 600) {
  const { BB, K, HR, '2B': doubles, '1B': singles, OUT } = simulationResults;
  
  const hits = HR + doubles + singles;
  const ab = pa - BB;
  const totalBases = HR * 4 + doubles * 2 + singles * 1;
  
  return {
    PA: pa,
    AB: ab,
    H: hits,
    HR: HR,
    '2B': doubles,
    '1B': singles,
    BB: BB,
    K: K,
    OUT: OUT,
    
    // 主要統計
    BA: ab > 0 ? hits / ab : 0,
    OBP: pa > 0 ? (hits + BB) / pa : 0,
    SLG: ab > 0 ? totalBases / ab : 0,
    OPS: 0, // 後面計算
    
    // 進階統計 (兼容舊系統)
    AVG: ab > 0 ? hits / ab : 0,
    
    // 比率統計
    'BB%': pa > 0 ? BB / pa : 0,
    'K%': pa > 0 ? K / pa : 0,
    'HR%': pa > 0 ? HR / pa : 0,
    'XBH%': pa > 0 ? (HR + doubles) / pa : 0,
    
    // 額外統計（保持相容性）
    HR_count: HR,
    doubles_count: doubles,
    BB_rate: pa > 0 ? BB / pa : 0,
    K_rate: pa > 0 ? K / pa : 0
  };
}

// 向下相容的統計計算函數
function calculateStats(simulationResults, pa = 600) {
  return calculateSimpleStats(simulationResults, pa);
}

// 完成統計計算
function finalizeSimpleStats(stats) {
  stats.OPS = stats.OBP + stats.SLG;
  return stats;
}

// 向下相容的完成統計函數
function finalizeStats(stats) {
  return finalizeSimpleStats(stats);
}

// 主要概率計算函數 (替代舊的 getPAEventProbabilities)
function getPAEventProbabilitiesNew(POW, HIT, EYE, playerHBPRate = 0) {
  // 使用大樣本模擬計算平均機率
  const simResults = simulateMultipleAtBats(EYE, HIT, POW, 10000);
  const total = 10000;
  
  return {
    HR: simResults.HR / total,
    '2B': simResults['2B'] / total,
    '1B': simResults['1B'] / total,
    BB: simResults.BB / total,
    HBP: playerHBPRate, // 保持兼容性
    K: simResults.K / total,
    IPO: simResults.OUT / total // OUT 映射到 IPO
  };
}

// 向下相容的主函數
function getPAEventProbabilities(POW, HIT, EYE, playerHBPRate = 0) {
  return getPAEventProbabilitiesNew(POW, HIT, EYE, playerHBPRate);
}

console.log('✅ 簡化打擊模擬引擎載入完成！');

// 全域變數導出
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 環境
  module.exports = {
    simulateAtBat,
    simulateMultipleAtBats,
    simulateSimpleAtBat,
    simulateSimpleMultipleBats,
    calculateStats,
    calculateSimpleStats,
    finalizeStats,
    finalizeSimpleStats,
    getPAEventProbabilitiesNew,
    getPAEventProbabilities
  };
  
  // Node.js 環境下也設置全域變數 (向下相容)
  global.getPAEventProbabilities = getPAEventProbabilitiesNew;
}

// 瀏覽器環境
if (typeof window !== 'undefined') {
  window.NEW_PROBABILITY_MODEL = {
    simulateAtBat,
    simulateMultipleAtBats,
    calculateStats,
    finalizeStats,
    getPAEventProbabilitiesNew
  };
  
  // 向下相容：覆寫舊函數
  window.getPAEventProbabilities = getPAEventProbabilitiesNew;
  
  // 全域函數導出 (供 calculateBatterOVR 使用)
  window.simulateMultipleAtBats = simulateMultipleAtBats;
  window.calculateStats = calculateStats;
  
  // 新簡化模型函數
  window.simulateSimpleAtBat = simulateSimpleAtBat;
  window.simulateSimpleMultipleBats = simulateSimpleMultipleBats;
  window.calculateSimpleStats = calculateSimpleStats;
  window.finalizeSimpleStats = finalizeSimpleStats;
}