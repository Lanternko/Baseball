# game_model.py

# 聯盟平均基礎費率 (每 PA) - 這些可以在系統校準時調整
BASE_P_BB = 0.085
BASE_P_K = 0.230 # 假設這是校準後的K率基線
BASE_P_HR = 0.030
BASE_P_2B = 0.045 
BASE_P_1B = 0.151 
LEAGUE_AVG_P_HBP_FOR_DENOM = 0.010 # 用於內部計算的聯盟平均HBP

# 「系統平衡型 SBX」線性調整因子 (這些是系統的核心參數，通過原型校準得到)
# 以下為示例值，實際值應來自您的校準過程
EYE_BB_LINEAR_FACTOR = 0.0011
EYE_K_LINEAR_FACTOR = 0.0012   # 正值代表高EYE降低K
HIT_K_LINEAR_FACTOR = 0.0012   # 正值代表高HIT降低K
POW_HR_LINEAR_FACTOR = 0.0013
HIT_1B_LINEAR_FACTOR = 0.00030
HIT_2B_LINEAR_FACTOR = 0.00022
POW_2B_LINEAR_FACTOR = 0.00050 # POW也影響2B

def get_player_pa_event_probabilities(POW, HIT, EYE, player_hbp_rate):
    # 使用上述 BASE_P_... 和 _LINEAR_FACTOR 來計算機率
    # 這裡的實現與之前的 get_player_pa_event_probabilities_system_calibrated 相同
    delta_POW = POW - 70
    delta_HIT = HIT - 70
    delta_EYE = EYE - 70

    p_bb = BASE_P_BB + delta_EYE * EYE_BB_LINEAR_FACTOR
    p_bb = max(0.01, min(0.25, p_bb)) 

    p_k = BASE_P_K - delta_EYE * EYE_K_LINEAR_FACTOR - delta_HIT * HIT_K_LINEAR_FACTOR 
    p_k = max(0.05, min(0.45, p_k)) 

    p_hbp = player_hbp_rate
    p_hbp = max(0.003, min(0.04, p_hbp))

    p_hr = BASE_P_HR + delta_POW * POW_HR_LINEAR_FACTOR
    p_hr = max(0.001, min(0.15, p_hr)) 

    p_2b = BASE_P_2B + delta_HIT * HIT_2B_LINEAR_FACTOR + delta_POW * POW_2B_LINEAR_FACTOR
    p_2b = max(0.005, min(0.15, p_2b))

    p_1b = BASE_P_1B + delta_HIT * HIT_1B_LINEAR_FACTOR 
    p_1b -= delta_POW * POW_2B_LINEAR_FACTOR * 0.25 
    p_1b = max(0.01, min(0.30, p_1b))
    
    current_sum_positive = p_hr + p_1b + p_2b + p_bb + p_hbp
    
    if current_sum_positive >= 1.0:
        target_sum_others = 1.0 - p_hbp
        current_sum_others = p_hr + p_1b + p_2b + p_bb
        if current_sum_others > 0:
            scaler = target_sum_others / current_sum_others
            p_hr *= scaler; p_1b *= scaler; p_2b *= scaler; p_bb *= scaler
        else: 
            p_hbp = min(1.0, p_hbp)
            p_hr=0; p_1b=0; p_2b=0; p_bb=0;

    final_sum_positive = p_hr + p_1b + p_2b + p_bb + p_hbp
    p_out = 1.0 - final_sum_positive
    p_out = max(0, p_out) 

    probs_list = [p_hr, p_1b, p_2b, p_bb, p_hbp, p_out]
    keys_list = ["HR", "1B", "2B", "BB", "HBP", "OUT"]
    
    current_total_prob = sum(probs_list) # 在非負校驗前計算總和可能更準確
    for i in range(len(probs_list)): # 確保非負
        if probs_list[i] < 0: probs_list[i] = 0
            
    current_total_prob = sum(probs_list) # 重新計算總和以進行歸一化
    if current_total_prob == 0:
        return {"HR": 0, "2B": 0, "1B": 0, "BB": 0, "HBP": 0, "OUT": 1.0}

    norm_factor = 1.0 / current_total_prob
    
    return {
        keys_list[i]: probs_list[i] * norm_factor for i in range(len(keys_list))
    }