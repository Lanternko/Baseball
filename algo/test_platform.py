# test_platform.py
import random # 仍然需要 random
import math   # 仍然需要 math
from game_model import get_player_pa_event_probabilities # 假設 SB2 因子已在 game_model 中
from simulation_engine import simulate_season, calculate_sim_stats
from player_data import (
    get_judge_target_stats, 
    get_goldschmidt_target_stats, 
    get_judge_anchor_abilities, 
    get_goldschmidt_anchor_abilities
)
from optimization_algorithms import find_best_attributes_random_search # 假設您將隨機搜索也放入模組

# --- 主要執行部分 ---
# 1. 獲取 Judge 的錨點能力和目標數據 (從 player_data.py)
judge_anchor_attrs = get_judge_anchor_abilities()
judge_targets_counts, judge_targets_ratios, judge_hbp_rate, judge_pa = get_judge_target_stats()

# 2. 為 Judge 尋找最佳屬性 (調用 optimization_algorithms.py)
#    find_best_attributes 會在其內部調用 game_model.get_player_pa_event_probabilities 
#    和 simulation_engine.simulate_season
# error_weights = { "BA": 1.0, "OBP": 1.5, "SLG": 1.2, "HR": 1.5, "BB": 1.5 } 
# deviation_penalty_weight = 0.05

# best_judge_attrs, min_err_judge = find_best_attributes_random_search(
#     player_name="Aaron Judge",
#     anchor_abilities=judge_anchor_attrs,
#     target_pa=judge_pa,
#     target_counts=judge_targets_counts,
#     target_ratios=judge_targets_ratios,
#     player_hbp_rate=judge_hbp_rate,
#     error_weights=error_weights, # 定義在主腳本或 optimization_algorithms 中
#     deviation_penalty_weight=deviation_penalty_weight, # 同上
#     # 傳入必要的函數引用
#     prob_calculator_func=get_player_pa_event_probabilities, 
#     season_simulator_func=simulate_season,
#     stats_calculator_func=calculate_sim_stats,
#     error_calculator_func=calculate_error_with_anchor # 假設 calculate_error 也移入
# )

# print(f"\n為 Aaron Judge 找到的最佳屬性：POW={best_judge_attrs['POW']:.2f}, HIT={best_judge_attrs['HIT']:.2f}, EYE={best_judge_attrs['EYE']:.2f} (誤差:{min_err_judge:.4f})")

# 3. 使用找到的最佳屬性進行最終確認模擬...
# ... (類似之前的最終確認和打印比較)

# 4. 同樣的流程應用於 Goldschmidt ...