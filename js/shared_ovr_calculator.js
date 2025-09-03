// ovr-calculator.js - 混合轉換版 OVR 計算器

// Define constants if not already available
const ATTRIBUTE_MAPPING_POINTS = {
    pr1: 40,
    pr50: 70,
    pr99: 99
};

const LEAGUE_BENCHMARKS = {
    xBA: { pr1: 0.200, pr50: 0.250, pr99: 0.330 },
    xSLG: { pr1: 0.310, pr50: 0.400, pr99: 0.640 },
    xwOBA: { pr1: 0.260, pr50: 0.320, pr99: 0.430 }
};

// 🔥 混合轉換函數：PR1 以下對數平滑，PR1 以上保持原版
function getAttributeScoreHybrid(metricVal, pr1Benchmark, pr50Benchmark, pr99Benchmark, statType) {
    const pr1_map = ATTRIBUTE_MAPPING_POINTS['pr1']; // 40
    const pr50_map = ATTRIBUTE_MAPPING_POINTS['pr50']; // 70
    const pr99_map = ATTRIBUTE_MAPPING_POINTS['pr99']; // 99
    const delta_50_1 = pr50_map - pr1_map;
    const delta_99_50 = pr99_map - pr50_map;
    
    // 🔥 關鍵判斷：是否在 PR1 以下的區間
    if (metricVal <= pr1Benchmark) {
        // 🔥 PR1 以下使用對數平滑函數
        
        let theoreticalMin = 0.000; // 所有統計都從 0 開始
        
        if (metricVal <= theoreticalMin) {
            return 0.1; // 極限值設為 0.1，避免 0 值問題
        }
        
        // 🔥 對數函數：上凸曲線，極限趨近於 0
        const normalizedProgress = (metricVal - theoreticalMin) / (pr1Benchmark - theoreticalMin);
        
       // 調整對數平滑參數以改善 40 屬性轉換
        const k = 4.0; // 降低: 5.0 → 4.0 (減少彎曲度)
        const logScore = pr1_map * Math.log(1 + k * normalizedProgress) / Math.log(1 + k);
        
        // 微調基準點對應
        if (statType === 'SLG') {
            return Math.max(0.1, logScore * 1.02); // POW 小幅提升
        }
        
        return Math.max(0.1, logScore);
    }
    
    // 🔥 PR1 以上完全使用原版邏輯 (保持不變)
    else {
        let score = 0;
        
        // 極值處理 (原版邏輯)
        const isExtremeValue = (
            (statType === 'BA' && metricVal >= 0.95) ||
            (statType === 'SLG' && metricVal >= 3.0) ||
            (statType === 'OBA' && metricVal >= 0.95)
        );
        
        if (isExtremeValue) {
            if (statType === 'BA' && metricVal >= 0.99) return 500;
            if (statType === 'SLG' && metricVal >= 3.99) return 500;
            if (statType === 'OBA' && metricVal >= 0.99) return 500;
            
            if (statType === 'BA') {
                return 200 + (metricVal - 0.95) / 0.05 * 300;
            }
            if (statType === 'SLG') {
                return 200 + (metricVal - 3.0) / 0.5 * 300;
            }
            if (statType === 'OBA') {
                return 200 + (metricVal - 0.95) / 0.05 * 300;
            }
        }
        
        // PR1 → PR50 (原版邏輯)
        if (metricVal <= pr50Benchmark) {
            score = pr1_map + delta_50_1 * (metricVal - pr1Benchmark) / (pr50Benchmark - pr1Benchmark);
        }
        // PR50 → PR99 (原版邏輯)
        else if (metricVal <= pr99Benchmark) {
            score = pr50_map + delta_99_50 * (metricVal - pr50Benchmark) / (pr99Benchmark - pr50Benchmark);
        }
        // PR99 以上 (原版邏輯)
        else {
            const slope_pr50_pr99 = delta_99_50 / (pr99Benchmark - pr50Benchmark);
            const basicExtension = pr99_map + slope_pr50_pr99 * (metricVal - pr99Benchmark);
            const overPr99Factor = (metricVal - pr99Benchmark) / (pr99Benchmark - pr50Benchmark);
            let extraBonus = 0;
            
            if (statType === 'SLG') {
                extraBonus = Math.min(overPr99Factor * 80, 300);
            } else if (statType === 'BA') {
                extraBonus = Math.min(overPr99Factor * 60, 250);
            } else if (statType === 'OBA') {
                extraBonus = Math.min(overPr99Factor * 60, 250);
            }
            
            score = basicExtension + extraBonus;
        }
        
        return Math.max(0.1, Math.min(500, score));
    }
}

// 🔥 數據轉三圍主函數（使用混合轉換）
function calculatePlayerGameAttributes(xBA, xSLG, xwOBA) {
    // 輸入處理
    const safeXBA = parseFloat(xBA) || 0;
    const safeXSLG = parseFloat(xSLG) || 0;
    const safeXwOBA = parseFloat(xwOBA) || 0;
    
    console.log('混合轉換輸入:', { xBA: safeXBA, xSLG: safeXSLG, xwOBA: safeXwOBA });
    
    // 🔥 使用混合轉換函數
    const powScore = getAttributeScoreHybrid(safeXSLG, LEAGUE_BENCHMARKS['xSLG']['pr1'], LEAGUE_BENCHMARKS['xSLG']['pr50'], LEAGUE_BENCHMARKS['xSLG']['pr99'], 'SLG');
    const hitScore = getAttributeScoreHybrid(safeXBA, LEAGUE_BENCHMARKS['xBA']['pr1'], LEAGUE_BENCHMARKS['xBA']['pr50'], LEAGUE_BENCHMARKS['xBA']['pr99'], 'BA');
    const eyeScore = getAttributeScoreHybrid(safeXwOBA, LEAGUE_BENCHMARKS['xwOBA']['pr1'], LEAGUE_BENCHMARKS['xwOBA']['pr50'], LEAGUE_BENCHMARKS['xwOBA']['pr99'], 'OBA');
    
    console.log('混合轉換結果:', { POW: powScore, HIT: hitScore, EYE: eyeScore });
    
    return {
        POW: powScore,
        HIT: hitScore,
        EYE: eyeScore
    };
}

// 防止無限迴圈的全域鎖
let isCalculatingOVR = false;

// 🎯 wOBA-Based OVR System
// OVR determined purely by simulated wOBA with anchor point calibration
// Principles: Higher wOBA = Higher OVR, Anchored to level standards
function calculateBatterOVR(pow, hit, eye) {
    // 防止無限遞歸
    if (isCalculatingOVR) {
        console.warn('檢測到遞歸調用 calculateBatterOVR，使用備用計算');
        return {
            ovr: Math.round((parseFloat(hit) || 75) * 0.35 + (parseFloat(pow) || 75) * 0.35 + (parseFloat(eye) || 75) * 0.30),
            breakdown: { error: '遞歸調用，使用備用計算' }
        };
    }
    
    isCalculatingOVR = true;
    
    try {
        // 輸入驗證
        const safePOW = Math.max(1, parseFloat(pow) || 1);
        const safeHIT = Math.max(1, parseFloat(hit) || 1);
        const safeEYE = Math.max(1, parseFloat(eye) || 1);
        
        console.log('OVR計算輸入:', { pow: safePOW, hit: safeHIT, eye: safeEYE });
    
        // For baseball project compatibility, use simpler calculation if advanced functions not available
        let woba;
        if (typeof simulateMultipleAtBats !== 'undefined' && typeof calculateStats !== 'undefined') {
            // 🎯 Step 1: 模擬球員表現獲得 wOBA
            const simResults = simulateMultipleAtBats(safeEYE, safeHIT, safePOW, 600);
            const simStats = calculateStats(simResults, 600);
            woba = calculateWOBAFromStats(simStats);
        } else {
            // Simplified wOBA estimation based on attributes
            woba = estimateWOBAFromAttributes(safePOW, safeHIT, safeEYE);
        }
        
        // 🎯 Step 2: 使用新的映射系統 wOBA → OVR
        const ovr = (typeof WOBAOVRMapping !== 'undefined') ? 
                    WOBAOVRMapping.findOVRFromWOBA(woba) : 
                    calculateOVRFromWOBA(woba); // 備用
        
        console.log('wOBA-based OVR計算結果:', {
            simulatedWOBA: woba.toFixed(3),
            mappedOVR: ovr.toFixed(1),
            pow: safePOW,
            hit: safeHIT,
            eye: safeEYE
        });
        
        return {
            ovr: Math.round(ovr),
            breakdown: {
                simulatedWOBA: woba.toFixed(3),
                rawOVR: ovr.toFixed(1),
                balanceRatio: (Math.min(safePOW, safeHIT, safeEYE) / Math.max(safePOW, safeHIT, safeEYE)).toFixed(3)
            }
        };
    } catch (error) {
        console.error('OVR計算過程中發生錯誤:', error);
        return {
            ovr: Math.round((parseFloat(hit) || 75) * 0.35 + (parseFloat(pow) || 75) * 0.35 + (parseFloat(eye) || 75) * 0.30),
            breakdown: { error: error.message }
        };
    } finally {
        isCalculatingOVR = false;
    }
}

// Simple wOBA estimation for baseball project compatibility
function estimateWOBAFromAttributes(pow, hit, eye) {
    // Basic estimation based on attributes - this is a simplified version
    const baseWOBA = 0.320; // League average
    
    // Scale attributes to reasonable ranges
    const hitEffect = (hit - 70) * 0.002; // HIT affects contact
    const powEffect = (pow - 70) * 0.003; // POW affects power
    const eyeEffect = (eye - 70) * 0.001; // EYE affects walks
    
    return Math.max(0.200, Math.min(0.600, baseWOBA + hitEffect + powEffect + eyeEffect));
}

// 🎯 從模擬統計計算 wOBA
function calculateWOBAFromStats(stats) {
    // MLB 2019-2021 average weights
    const weights = {
        BB: 0.692,
        '1B': 0.879, 
        '2B': 1.242,
        '3B': 1.568,
        HR: 2.081
    };
    
    const plateAppearances = stats.AB + stats.BB + (stats.HBP || 0);
    if (plateAppearances === 0) return 0;
    
    // 從模擬結果計算各種安打類型
    const hits = Math.round(stats.H || 0);
    const doubles = Math.round(stats['2B'] || 0);
    const triples = Math.round(stats['3B'] || 0);  
    const homers = Math.round(stats.HR_count || 0);
    const singles = Math.max(0, hits - doubles - triples - homers);
    const walks = Math.round(stats.BB || 0);
    
    const woba = (walks * weights.BB + 
                 singles * weights['1B'] + 
                 doubles * weights['2B'] + 
                 triples * weights['3B'] + 
                 homers * weights.HR) / plateAppearances;
                 
    return woba;
}

// 🎯 廢棄：硬編碼錨點映射函數（僅作為備用）
function calculateOVRFromWOBA(woba) {
    // 備用：簡化版本，僅在新映射系統不可用時使用
    console.warn('使用備用OVR映射系統，建議檢查 WOBAOVRMapping 載入狀況');
    
    // 簡化線性映射：wOBA 0.3-0.6 → OVR 40-150
    if (woba <= 0.3) return Math.max(1, 40 * (woba / 0.3));
    if (woba >= 0.6) return Math.min(200, 150 + (woba - 0.6) * 100);
    
    // 線性插值 0.3-0.6 → 40-150
    return 40 + (woba - 0.3) / (0.6 - 0.3) * (150 - 40);
}

// 🎯 聯盟水準判定函數 (基於總和實力標準)
function getLeagueLevel(ovr) {
    if (ovr >= 140) return "歷史傳奇 🐐";
    if (ovr >= 120) return "名人堂級 👑";
    if (ovr >= 100) return "精英球員 🔥";
    if (ovr >= 85) return "優質先發 ⭐";
    if (ovr >= 70) return "聯盟平均 📈";
    if (ovr >= 55) return "大聯盟替補 ⚾";
    if (ovr >= 40) return "邊緣球員 📉";
    return "小聯盟水準 🏃";
}

// 🎯 均衡度描述函數
function getBalanceDescription(ratio) {
    if (ratio >= 0.95) return "(完美均衡)";
    if (ratio >= 0.85) return "(優秀均衡)";
    if (ratio >= 0.70) return "(良好均衡)";
    if (ratio >= 0.55) return "(略有偏科)";
    return "(明顯偏科)";
}

// 🎯 wOBA-Based OVR分解顯示
function displayOVRBreakdown(breakdown, targetElement) {
    if (!targetElement) return;
    
    // 獲取 OVR 值
    let ovr = 1;
    try {
        const ovrElement = targetElement.parentElement.querySelector('.ovr-number');
        ovr = parseInt(ovrElement.textContent) || 1;
    } catch (e) {
        console.error('無法獲取 OVR 值:', e);
    }
    
    const html = `
        <strong>wOBA-Based OVR分析：</strong><br>
        模擬 wOBA：${breakdown.simulatedWOBA}<br>
        映射 OVR：${breakdown.rawOVR}<br>
        均衡比例：${breakdown.balanceRatio} ${getBalanceDescription(parseFloat(breakdown.balanceRatio))}<br>
        <strong>聯盟水準：${getLeagueLevel(ovr)}</strong>
        ${breakdown.error ? `<br><span style="color: red;">錯誤: ${breakdown.error}</span>` : ''}
    `;
    
    targetElement.innerHTML = html;
}

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getAttributeScoreHybrid,
        calculatePlayerGameAttributes,
        calculateBatterOVR,
        calculateWOBAFromStats,
        calculateOVRFromWOBA,
        getLeagueLevel,
        getBalanceDescription,
        displayOVRBreakdown,
        estimateWOBAFromAttributes
    };
}

// Browser environment
if (typeof window !== 'undefined') {
    window.getAttributeScoreHybrid = getAttributeScoreHybrid;
    window.calculatePlayerGameAttributes = calculatePlayerGameAttributes;
    window.calculateBatterOVR = calculateBatterOVR;
    window.calculateWOBAFromStats = calculateWOBAFromStats;
    window.calculateOVRFromWOBA = calculateOVRFromWOBA;
    window.getLeagueLevel = getLeagueLevel;
    window.getBalanceDescription = getBalanceDescription;
    window.displayOVRBreakdown = displayOVRBreakdown;
    window.estimateWOBAFromAttributes = estimateWOBAFromAttributes;
}