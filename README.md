Baseball simulation games.

Can be play in website(PC recommend) https://lanternko.github.io/Baseball/

```baseball_simulator/
├── index.html
├── style.css
├── js/
│   ├── main.js           # Main game control
│   ├── config.js         # Game configuration (probilities, OVR.)
│   ├── playerUtils.js    # createPlayer, OVR calculations, team data
│   ├── ui.js             # UI pages
│   └── gameLogic.js      # simulateAtBat, processAtBatOutcome, inning logic, etc.
```

百分位基準值 (PR1, PR50, PR99)
我們將繼續使用您之前為聯盟整體水平設定的百分位基準值：

xBA: PR1 = 0.200, PR50 = 0.250, PR99 = 0.330
xSLG: PR1 = 0.310, PR50 = 0.400, PR99 = 0.640
xwOBA: PR1 = 0.260, PR50 = 0.320, PR99 = 0.430
以及對應的遊戲屬性轉換點：PR1能力值=40，PR50能力值=70，PR99能力值=99。
如果球員特別強或特別爛，數值可以超過上限。

打者的三圍能力
POW力量：影響HR、2B
HIT打擊：影響打擊率
EYE選球：影響保送；和因為選球關係，微幅提升安打和長打