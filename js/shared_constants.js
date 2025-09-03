// constants.js - 簡化模型常數表
// 🎯 設計理念: 5個簡潔表格，HIT→安打, POW→XBH, EYE→BB+接觸加成

console.log('🔥 載入簡化常數系統...');

// ====================================
// 🎯 新的常數表架構（5個表）
// ====================================

// EYE決定保送率（保持不變）
const EYE_BB_RATE_TABLE = [
  [1, 0.001],    // 極低EYE: 0.1% BB率
  [20, 0.025],   // 業餘低端: 2.5% BB率
  [40, 0.05],    // pr1: 5% BB率
  [70, 0.087],   // pr50: 8.7% BB率
  [100, 0.170],  // pr99: 17% BB率
  [120, 0.20],   // 理論極限: 20% BB率
  [150, 0.270],  // 人類極限: 27% BB率
  [300, 0.450],  // 超人水準: 45% BB率
  [500, 0.800]   // 數學極限: 80% BB率
];

// 🆕 EYE對接觸率的小幅加成（新表）
const EYE_CONTACT_BONUS_TABLE = [
  [1, 0.000],    // 極低EYE: 無加成
  [20, 0.005],   // 業餘低端: +0.5% 接觸率
  [40, 0.010],   // pr1: +1% 接觸率
  [70, 0.018],   // pr50: +1.8% 接觸率
  [100, 0.030],  // pr99: +3% 接觸率（小幅提升BA）
  [120, 0.035],  // 理論極限: +3.5% 接觸率
  [150, 0.040],  // 人類極限: +4% 接觸率
  [300, 0.060],  // 超人水準: +6% 接觸率
  [500, 0.080]   // 數學極限: +8% 接觸率
];

// HIT決定基礎接觸率（保持不變）
const HIT_CONTACT_RATE_TABLE = [
  [1, 0.05],     // 極低HIT: 5% 總接觸率
  [20, 0.4],     // 業餘低端: 40% 總接觸率
  [40, 0.53],    // pr1: 53% 總接觸率
  [70, 0.59],    // pr50: 59% 總接觸率
  [100, 0.62],   // pr99: 62% 總接觸率
  [120, 0.65],   // 理論極限: 65% 總接觸率
  [150, 0.66],   // 人類極限: 66% 總接觸率
  [300, 0.85],   // 超人水準: 85% 總接觸率
  [500, 0.9]     // 數學極限: 90% 總接觸率
];

// 🆕 HIT決定接觸轉安打率（新表）
const HIT_SUCCESS_RATE_TABLE = [
  [1, 0.05],     // 極低HIT: 接觸中5%成安打
  [20, 0.25],    // 業餘低端: 接觸中25%成安打
  [40, 0.42],    // pr1: 接觸中42%成安打 → BA ≈ 53% × 42% = 0.22
  [70, 0.48],    // pr50: 接觸中48%成安打 → BA ≈ 59% × 48% = 0.28
  [100, 0.52],   // pr99: 接觸中52%成安打 → BA ≈ 62% × 52% = 0.32
  [120, 0.55],   // 理論極限: 接觸中55%成安打
  [150, 0.58],   // 人類極限: 接觸中58%成安打
  [300, 0.80],   // 超人水準: 接觸中80%成安打
  [500, 0.95]    // 數學極限: 接觸中95%成安打
];

// POW決定安打中XBH率（修正：基於安打而非接觸）
const POW_XBH_RATE_TABLE = [
  [1, 0.02],     // 極低POW: 安打中2%是XBH
  [20, 0.10],    // 業餘低端: 安打中10%是XBH
  [40, 0.18],    // pr1: 安打中18%是XBH → XBH ≈ BA × 18%
  [70, 0.25],    // pr50: 安打中25%是XBH → XBH ≈ BA × 25%
  [100, 0.35],   // pr99: 安打中35%是XBH → XBH ≈ BA × 35%
  [120, 0.42],   // 理論極限: 安打中42%是XBH
  [150, 0.50],   // 人類極限: 安打中50%是XBH
  [300, 0.75],   // 超人水準: 安打中75%是XBH
  [500, 0.95]    // 數學極限: 安打中95%是XBH
];

// POW決定XBH中HR比例（保持不變）
const POW_HR_RATIO_TABLE = [
  [1, 0.01],     // 極低POW: XBH中1%是HR
  [20, 0.05],    // 業餘低端: XBH中5%是HR
  [40, 0.129],   // pr1: XBH中12.9%是HR
  [70, 0.42],    // pr50: XBH中42%是HR
  [100, 0.5],    // pr99: XBH中50%是HR
  [120, 0.55],   // 理論極限: XBH中55%是HR
  [150, 0.77],   // 人類極限: XBH中77%是HR
  [300, 0.75],   // 超人水準: XBH中75%是HR
  [500, 0.99]    // 數學極限: XBH中99%是HR
];

// ====================================
// 🛠️ 通用工具函數  
// ====================================

// 插值函數（復用）
function interpolate(value, anchors) {
  value = Math.max(1, Math.min(500, value));
  
  for (let i = 0; i < anchors.length - 1; i++) {
    const [x1, y1] = anchors[i];
    const [x2, y2] = anchors[i + 1];
    
    if (value >= x1 && value <= x2) {
      if (x2 === x1) return y1;
      return y1 + (y2 - y1) * (value - x1) / (x2 - x1);
    }
  }
  
  return value <= anchors[0][0] ? anchors[0][1] : anchors[anchors.length - 1][1];
}

// ====================================
// 🚀 模塊導出
// ====================================

console.log('✅ 簡化常數系統載入完成！');

// 導出函數
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EYE_BB_RATE_TABLE,
    EYE_CONTACT_BONUS_TABLE,
    HIT_CONTACT_RATE_TABLE,
    HIT_SUCCESS_RATE_TABLE,
    POW_XBH_RATE_TABLE,
    POW_HR_RATIO_TABLE,
    interpolate
  };
}

// 瀏覽器環境
if (typeof window !== 'undefined') {
  // 設定全域變數
  window.EYE_BB_RATE_TABLE = EYE_BB_RATE_TABLE;
  window.EYE_CONTACT_BONUS_TABLE = EYE_CONTACT_BONUS_TABLE;
  window.HIT_CONTACT_RATE_TABLE = HIT_CONTACT_RATE_TABLE;
  window.HIT_SUCCESS_RATE_TABLE = HIT_SUCCESS_RATE_TABLE;
  window.POW_XBH_RATE_TABLE = POW_XBH_RATE_TABLE;
  window.POW_HR_RATIO_TABLE = POW_HR_RATIO_TABLE;
  window.interpolate = interpolate;
  
  // 也保留物件形式
  window.SIMPLE_CONSTANTS = {
    EYE_BB_RATE_TABLE,
    EYE_CONTACT_BONUS_TABLE,
    HIT_CONTACT_RATE_TABLE,
    HIT_SUCCESS_RATE_TABLE,
    POW_XBH_RATE_TABLE,
    POW_HR_RATIO_TABLE,
    interpolate
  };
}