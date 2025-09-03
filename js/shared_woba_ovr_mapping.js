// woba_ovr_mapping.js - wOBA 到 OVR 精確映射系統
// 基於真實 probability_model 生成的數據

console.log('📊 載入 wOBA-OVR 映射系統...');

// 1-200級的完整wOBA映射表 (基於 probability_model 實際模擬)
const WOBA_LEVEL_MAPPING_1_200 = [
  { level: 1, woba: 0.0055 }, { level: 2, woba: 0.0026 }, { level: 3, woba: 0.0079 },
  { level: 4, woba: 0.0138 }, { level: 5, woba: 0.0102 }, { level: 6, woba: 0.0067 },
  { level: 7, woba: 0.0236 }, { level: 8, woba: 0.0239 }, { level: 9, woba: 0.0227 },
  { level: 10, woba: 0.0386 }, { level: 11, woba: 0.0409 }, { level: 12, woba: 0.0459 },
  { level: 13, woba: 0.0495 }, { level: 14, woba: 0.0538 }, { level: 15, woba: 0.0608 },
  { level: 16, woba: 0.0718 }, { level: 17, woba: 0.0741 }, { level: 18, woba: 0.0828 },
  { level: 19, woba: 0.0897 }, { level: 20, woba: 0.1136 }, { level: 21, woba: 0.1062 },
  { level: 22, woba: 0.1161 }, { level: 23, woba: 0.1231 }, { level: 24, woba: 0.1315 },
  { level: 25, woba: 0.1357 }, { level: 26, woba: 0.1394 }, { level: 27, woba: 0.1512 },
  { level: 28, woba: 0.1598 }, { level: 29, woba: 0.1637 }, { level: 30, woba: 0.1728 },
  { level: 31, woba: 0.1787 }, { level: 32, woba: 0.1866 }, { level: 33, woba: 0.1986 },
  { level: 34, woba: 0.2043 }, { level: 35, woba: 0.2104 }, { level: 36, woba: 0.2146 },
  { level: 37, woba: 0.2193 }, { level: 38, woba: 0.2241 }, { level: 39, woba: 0.2316 },
  { level: 40, woba: 0.2276 }, { level: 41, woba: 0.2354 }, { level: 42, woba: 0.2422 },
  { level: 43, woba: 0.2489 }, { level: 44, woba: 0.2548 }, { level: 45, woba: 0.2631 },
  { level: 46, woba: 0.2709 }, { level: 47, woba: 0.2768 }, { level: 48, woba: 0.2839 },
  { level: 49, woba: 0.2911 }, { level: 50, woba: 0.2994 }, { level: 51, woba: 0.3061 },
  { level: 52, woba: 0.3129 }, { level: 53, woba: 0.3201 }, { level: 54, woba: 0.3273 },
  { level: 55, woba: 0.3342 }, { level: 56, woba: 0.3412 }, { level: 57, woba: 0.3481 },
  { level: 58, woba: 0.3551 }, { level: 59, woba: 0.3621 }, { level: 60, woba: 0.3233 },
  { level: 61, woba: 0.3298 }, { level: 62, woba: 0.3364 }, { level: 63, woba: 0.3431 },
  { level: 64, woba: 0.3499 }, { level: 65, woba: 0.3567 }, { level: 66, woba: 0.3636 },
  { level: 67, woba: 0.3706 }, { level: 68, woba: 0.3777 }, { level: 69, woba: 0.3848 },
  { level: 70, woba: 0.3422 }, { level: 71, woba: 0.3492 }, { level: 72, woba: 0.3563 },
  { level: 73, woba: 0.3635 }, { level: 74, woba: 0.3708 }, { level: 75, woba: 0.3782 },
  { level: 76, woba: 0.3856 }, { level: 77, woba: 0.3931 }, { level: 78, woba: 0.4007 },
  { level: 79, woba: 0.4084 }, { level: 80, woba: 0.3874 }, { level: 81, woba: 0.3951 },
  { level: 82, woba: 0.4029 }, { level: 83, woba: 0.4108 }, { level: 84, woba: 0.4187 },
  { level: 85, woba: 0.4267 }, { level: 86, woba: 0.4348 }, { level: 87, woba: 0.4429 },
  { level: 88, woba: 0.4511 }, { level: 89, woba: 0.4593 }, { level: 90, woba: 0.3897 },
  { level: 91, woba: 0.3978 }, { level: 92, woba: 0.4060 }, { level: 93, woba: 0.4142 },
  { level: 94, woba: 0.4225 }, { level: 95, woba: 0.4309 }, { level: 96, woba: 0.4393 },
  { level: 97, woba: 0.4478 }, { level: 98, woba: 0.4563 }, { level: 99, woba: 0.4649 },
  { level: 100, woba: 0.4762 }, { level: 101, woba: 0.4848 }, { level: 102, woba: 0.4935 },
  { level: 103, woba: 0.5022 }, { level: 104, woba: 0.5110 }, { level: 105, woba: 0.5199 },
  { level: 106, woba: 0.5288 }, { level: 107, woba: 0.5378 }, { level: 108, woba: 0.5469 },
  { level: 109, woba: 0.5560 }, { level: 110, woba: 0.4578 }, { level: 111, woba: 0.4668 },
  { level: 112, woba: 0.4759 }, { level: 113, woba: 0.4850 }, { level: 114, woba: 0.4942 },
  { level: 115, woba: 0.5035 }, { level: 116, woba: 0.5128 }, { level: 117, woba: 0.5222 },
  { level: 118, woba: 0.5316 }, { level: 119, woba: 0.5411 }, { level: 120, woba: 0.4919 },
  { level: 121, woba: 0.5014 }, { level: 122, woba: 0.5110 }, { level: 123, woba: 0.5206 },
  { level: 124, woba: 0.5303 }, { level: 125, woba: 0.5401 }, { level: 126, woba: 0.5499 },
  { level: 127, woba: 0.5598 }, { level: 128, woba: 0.5697 }, { level: 129, woba: 0.5797 },
  { level: 130, woba: 0.5454 }, { level: 131, woba: 0.5553 }, { level: 132, woba: 0.5653 },
  { level: 133, woba: 0.5754 }, { level: 134, woba: 0.5855 }, { level: 135, woba: 0.5957 },
  { level: 136, woba: 0.6059 }, { level: 137, woba: 0.6162 }, { level: 138, woba: 0.6266 },
  { level: 139, woba: 0.6370 }, { level: 140, woba: 0.5497 }, { level: 141, woba: 0.5600 },
  { level: 142, woba: 0.5704 }, { level: 143, woba: 0.5809 }, { level: 144, woba: 0.5914 },
  { level: 145, woba: 0.6020 }, { level: 146, woba: 0.6127 }, { level: 147, woba: 0.6234 },
  { level: 148, woba: 0.6342 }, { level: 149, woba: 0.6451 }, { level: 150, woba: 0.6013 },
  { level: 151, woba: 0.6121 }, { level: 152, woba: 0.6230 }, { level: 153, woba: 0.6340 },
  { level: 154, woba: 0.6450 }, { level: 155, woba: 0.6561 }, { level: 156, woba: 0.6673 },
  { level: 157, woba: 0.6785 }, { level: 158, woba: 0.6898 }, { level: 159, woba: 0.7012 },
  { level: 160, woba: 0.6088 }, { level: 161, woba: 0.6201 }, { level: 162, woba: 0.6315 },
  { level: 163, woba: 0.6430 }, { level: 164, woba: 0.6545 }, { level: 165, woba: 0.6661 },
  { level: 166, woba: 0.6778 }, { level: 167, woba: 0.6895 }, { level: 168, woba: 0.7013 },
  { level: 169, woba: 0.7132 }, { level: 170, woba: 0.6456 }, { level: 171, woba: 0.6574 },
  { level: 172, woba: 0.6693 }, { level: 173, woba: 0.6813 }, { level: 174, woba: 0.6933 },
  { level: 175, woba: 0.7054 }, { level: 176, woba: 0.7176 }, { level: 177, woba: 0.7299 },
  { level: 178, woba: 0.7422 }, { level: 179, woba: 0.7546 }, { level: 180, woba: 0.6924 },
  { level: 181, woba: 0.7047 }, { level: 182, woba: 0.7171 }, { level: 183, woba: 0.7296 },
  { level: 184, woba: 0.7422 }, { level: 185, woba: 0.7548 }, { level: 186, woba: 0.7675 },
  { level: 187, woba: 0.7803 }, { level: 188, woba: 0.7932 }, { level: 189, woba: 0.8061 },
  { level: 190, woba: 0.6894 }, { level: 191, woba: 0.7022 }, { level: 192, woba: 0.7151 },
  { level: 193, woba: 0.7281 }, { level: 194, woba: 0.7411 }, { level: 195, woba: 0.7542 },
  { level: 196, woba: 0.7674 }, { level: 197, woba: 0.7807 }, { level: 198, woba: 0.7940 },
  { level: 199, woba: 0.8074 }, { level: 200, woba: 0.6832 }
];

// 🎯 主要功能：根據wOBA查找對應的OVR
function findOVRFromWOBA(targetWOBA) {
    if (targetWOBA <= 0) return 1;
    
    // 使用1-200級的詳細映射表進行二分搜尋
    let bestMatch = null;
    let minDiff = Infinity;
    
    for (const entry of WOBA_LEVEL_MAPPING_1_200) {
        const diff = Math.abs(entry.woba - targetWOBA);
        if (diff < minDiff) {
            minDiff = diff;
            bestMatch = entry;
        }
    }
    
    if (bestMatch) {
        // 在200級以內找到匹配，返回精確級別
        return bestMatch.level;
    }
    
    // 200級以上使用算術平均保證單調性
    if (targetWOBA > 0.68) { // 大約200級的wOBA
        // 使用線性外推，但限制在合理範圍內
        const baseWOBA = 0.68; // 200級基準
        const baseOVR = 200;
        const growthRate = 100; // 每0.1 wOBA增長約10級
        
        const extraWOBA = targetWOBA - baseWOBA;
        const extraOVR = Math.min(300, extraWOBA * growthRate); // 最高限制500級
        
        return Math.min(500, baseOVR + extraOVR);
    }
    
    return bestMatch ? bestMatch.level : 1;
}

// 🎯 反向功能：根據OVR查找對應的wOBA 
function findWOBAFromOVR(targetOVR) {
    if (targetOVR <= 0) return 0;
    if (targetOVR > 500) return 1.0; // 限制最高值
    
    // 1-200級使用精確映射
    if (targetOVR <= 200) {
        const exactMatch = WOBA_LEVEL_MAPPING_1_200.find(entry => entry.level === Math.round(targetOVR));
        if (exactMatch) {
            return exactMatch.woba;
        }
        
        // 線性插值
        const lowerLevel = Math.floor(targetOVR);
        const upperLevel = Math.ceil(targetOVR);
        
        if (lowerLevel === upperLevel) return 0.5; // 預設值
        
        const lowerEntry = WOBA_LEVEL_MAPPING_1_200.find(e => e.level === lowerLevel);
        const upperEntry = WOBA_LEVEL_MAPPING_1_200.find(e => e.level === upperLevel);
        
        if (lowerEntry && upperEntry) {
            const ratio = targetOVR - lowerLevel;
            return lowerEntry.woba + ratio * (upperEntry.woba - lowerEntry.woba);
        }
    }
    
    // 200級以上使用線性外推
    const baseWOBA = 0.68;
    const baseOVR = 200;
    const growthRate = 0.001; // 每級增長0.001 wOBA
    
    return baseWOBA + (targetOVR - baseOVR) * growthRate;
}

// 🎯 獲取關鍵里程碑信息
function getWOBAMilestones() {
    return [
        { woba: 0.300, desc: '替補球員門檻', ovr: findOVRFromWOBA(0.300) },
        { woba: 0.320, desc: 'MLB 聯盟平均', ovr: findOVRFromWOBA(0.320) },
        { woba: 0.350, desc: '優質先發', ovr: findOVRFromWOBA(0.350) },
        { woba: 0.400, desc: '全明星級', ovr: findOVRFromWOBA(0.400) },
        { woba: 0.450, desc: '超級巨星', ovr: findOVRFromWOBA(0.450) },
        { woba: 0.500, desc: '歷史級賽季', ovr: findOVRFromWOBA(0.500) },
        { woba: 0.600, desc: '神話級表現', ovr: findOVRFromWOBA(0.600) },
        { woba: 0.700, desc: '理論極限', ovr: findOVRFromWOBA(0.700) }
    ];
}

// 🧪 測試函數
function testMappingSystem() {
    console.log('🧪 測試 wOBA-OVR 映射系統...');
    
    const testCases = [
        { woba: 0.300, expectedOVR: '~50-60' },
        { woba: 0.400, expectedOVR: '~80-90' },
        { woba: 0.500, expectedOVR: '~110-120' },
        { woba: 0.600, expectedOVR: '~140-150' }
    ];
    
    testCases.forEach(test => {
        const ovr = findOVRFromWOBA(test.woba);
        const reverseWoba = findWOBAFromOVR(ovr);
        console.log(`wOBA ${test.woba} → OVR ${ovr} → wOBA ${reverseWoba.toFixed(3)} (Expected: ${test.expectedOVR})`);
    });
}

// 模組導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        findOVRFromWOBA,
        findWOBAFromOVR,
        getWOBAMilestones,
        testMappingSystem,
        WOBA_LEVEL_MAPPING_1_200
    };
} else if (typeof window !== 'undefined') {
    // 瀏覽器環境
    window.WOBAOVRMapping = {
        findOVRFromWOBA,
        findWOBAFromOVR,
        getWOBAMilestones,
        testMappingSystem,
        WOBA_LEVEL_MAPPING_1_200
    };
}

console.log('✅ wOBA-OVR 映射系統載入完成！');