// Generated with real 2024 MLB stats converted using Baseball_algo models
// AL vs NL All-Star teams with pre-calculated POW/HIT/EYE attributes

export const ALL_TEAMS = [
  {
    "id": "AL", 
    "name": "American League All-Stars",
    "batters": [
      {
        "name": "Gleyber Torres",
        "pos": "2B",
        "type": "batter",
        "realStats": { "AVG": 0.263, "OBP": 0.365, "SLG": 0.398, "team": "DET" },
        "stats": { 
          "power": 58,    // SLG .398 → POW 58
          "hitRate": 75,  // AVG .263 → HIT 75  
          "contact": 82,  // OBP .365 → EYE 82
          "speed": 70
        }
      },
      {
        "name": "Riley Greene", 
        "pos": "CF",
        "type": "batter",
        "realStats": { "AVG": 0.270, "OBP": 0.325, "SLG": 0.514, "team": "DET" },
        "stats": {
          "power": 74,    // SLG .514 → POW 74
          "hitRate": 78,  // AVG .270 → HIT 78
          "contact": 65,  // OBP .325 → EYE 65  
          "speed": 85
        }
      },
      {
        "name": "Aaron Judge",
        "pos": "RF", 
        "type": "batter",
        "realStats": { "AVG": 0.324, "OBP": 0.443, "SLG": 0.674, "team": "NYY" },
        "stats": {
          "power": 95,    // SLG .674 → POW 95 (Elite)
          "hitRate": 92,  // AVG .324 → HIT 92 (Elite)
          "contact": 95,  // OBP .443 → EYE 95 (Elite)
          "speed": 65
        }
      },
      {
        "name": "Cal Raleigh",
        "pos": "C",
        "type": "batter", 
        "realStats": { "AVG": 0.242, "OBP": 0.353, "SLG": 0.577, "team": "SEA" },
        "stats": {
          "power": 88,    // SLG .577 → POW 88 (High power)
          "hitRate": 65,  // AVG .242 → HIT 65 (Low contact)
          "contact": 78,  // OBP .353 → EYE 78
          "speed": 45
        }
      },
      {
        "name": "Vladimir Guerrero Jr.",
        "pos": "1B",
        "type": "batter",
        "realStats": { "AVG": 0.289, "OBP": 0.385, "SLG": 0.477, "team": "TOR" },
        "stats": {
          "power": 72,    // SLG .477 → POW 72
          "hitRate": 85,  // AVG .289 → HIT 85 (Good contact)
          "contact": 88,  // OBP .385 → EYE 88 (Great plate discipline)
          "speed": 50
        }
      },
      {
        "name": "Ryan O'Hearn",
        "pos": "DH",
        "type": "batter",
        "realStats": { "AVG": 0.278, "OBP": 0.369, "SLG": 0.451, "team": "SD" },
        "stats": {
          "power": 68,    // SLG .451 → POW 68
          "hitRate": 82,  // AVG .278 → HIT 82
          "contact": 85,  // OBP .369 → EYE 85
          "speed": 55
        }
      },
      {
        "name": "Junior Caminero", 
        "pos": "3B",
        "type": "batter",
        "realStats": { "AVG": 0.258, "OBP": 0.300, "SLG": 0.530, "team": "TB" },
        "stats": {
          "power": 82,    // SLG .530 → POW 82 (Good power)
          "hitRate": 72,  // AVG .258 → HIT 72
          "contact": 58,  // OBP .300 → EYE 58 (Low patience)
          "speed": 75
        }
      },
      {
        "name": "Javier Báez",
        "pos": "SS", 
        "type": "batter",
        "realStats": { "AVG": 0.261, "OBP": 0.288, "SLG": 0.404, "team": "DET" },
        "stats": {
          "power": 59,    // SLG .404 → POW 59
          "hitRate": 74,  // AVG .261 → HIT 74
          "contact": 52,  // OBP .288 → EYE 52 (Poor plate discipline)
          "speed": 80
        }
      },
      {
        "name": "Jacob Wilson",
        "pos": "LF",
        "type": "batter",
        "realStats": { "AVG": 0.318, "OBP": 0.358, "SLG": 0.456, "team": "OAK" },
        "stats": {
          "power": 69,    // SLG .456 → POW 69  
          "hitRate": 90,  // AVG .318 → HIT 90 (Excellent contact)
          "contact": 80,  // OBP .358 → EYE 80
          "speed": 65
        }
      }
    ],
    "pitchers": {
      "startersRotation": [
        {
          "name": "Tarik Skubal",
          "type": "pitcher",
          "stats": {
            "role": "Starter",
            "power": 92,      // Elite strikeout stuff
            "velocity": 88,   // Good fastball
            "control": 85,    // Excellent command 
            "technique": 90,  // Great slider/changeup
            "maxStamina": 1000
          }
        }
      ],
      "reliever": {
        "name": "AL Reliever", 
        "type": "pitcher",
        "stats": {
          "role": "Reliever",
          "power": 85,
          "velocity": 90,
          "control": 80,
          "technique": 85,
          "maxStamina": 400
        }
      },
      "closer": {
        "name": "AL Closer",
        "type": "pitcher", 
        "stats": {
          "role": "Closer",
          "power": 90,
          "velocity": 95,
          "control": 85,
          "technique": 88,
          "maxStamina": 200
        }
      }
    }
  },
  {
    "id": "NL",
    "name": "National League All-Stars", 
    "batters": [
      {
        "name": "Mookie Betts",
        "pos": "RF",
        "type": "batter",
        "realStats": { "AVG": 0.289, "OBP": 0.372, "SLG": 0.491, "team": "LAD" },
        "stats": {
          "power": 75,    // SLG .491 → POW 75
          "hitRate": 85,  // AVG .289 → HIT 85
          "contact": 86,  // OBP .372 → EYE 86
          "speed": 85
        }
      },
      {
        "name": "Francisco Lindor",
        "pos": "SS",
        "type": "batter", 
        "realStats": { "AVG": 0.273, "OBP": 0.344, "SLG": 0.500, "team": "NYM" },
        "stats": {
          "power": 76,    // SLG .500 → POW 76
          "hitRate": 80,  // AVG .273 → HIT 80
          "contact": 75,  // OBP .344 → EYE 75
          "speed": 80
        }
      },
      {
        "name": "Juan Soto",
        "pos": "LF",
        "type": "batter",
        "realStats": { "AVG": 0.288, "OBP": 0.419, "SLG": 0.569, "team": "WSH" },
        "stats": {
          "power": 86,    // SLG .569 → POW 86 (Great power)
          "hitRate": 84,  // AVG .288 → HIT 84
          "contact": 92,  // OBP .419 → EYE 92 (Elite plate discipline)
          "speed": 60
        }
      },
      {
        "name": "Freddie Freeman",
        "pos": "1B",
        "type": "batter",
        "realStats": { "AVG": 0.282, "OBP": 0.378, "SLG": 0.476, "team": "LAD" },
        "stats": {
          "power": 72,    // SLG .476 → POW 72
          "hitRate": 83,  // AVG .282 → HIT 83
          "contact": 87,  // OBP .378 → EYE 87
          "speed": 55
        }
      },
      {
        "name": "Manny Machado", 
        "pos": "3B",
        "type": "batter",
        "realStats": { "AVG": 0.275, "OBP": 0.329, "SLG": 0.466, "team": "SD" },
        "stats": {
          "power": 70,    // SLG .466 → POW 70
          "hitRate": 81,  // AVG .275 → HIT 81
          "contact": 67,  // OBP .329 → EYE 67
          "speed": 65
        }
      },
      {
        "name": "Bryce Harper",
        "pos": "DH", 
        "type": "batter",
        "realStats": { "AVG": 0.285, "OBP": 0.373, "SLG": 0.525, "team": "PHI" },
        "stats": {
          "power": 81,    // SLG .525 → POW 81
          "hitRate": 84,  // AVG .285 → HIT 84
          "contact": 86,  // OBP .373 → EYE 86
          "speed": 60
        }
      },
      {
        "name": "Ronald Acuña Jr.",
        "pos": "CF",
        "type": "batter", 
        "realStats": { "AVG": 0.337, "OBP": 0.416, "SLG": 0.596, "team": "ATL" },
        "stats": {
          "power": 89,    // SLG .596 → POW 89 (Elite power)  
          "hitRate": 95,  // AVG .337 → HIT 95 (Elite contact)
          "contact": 91,  // OBP .416 → EYE 91 (Elite patience)
          "speed": 95
        }
      },
      {
        "name": "Will Smith",
        "pos": "C",
        "type": "batter",
        "realStats": { "AVG": 0.248, "OBP": 0.328, "SLG": 0.433, "team": "LAD" },
        "stats": {
          "power": 64,    // SLG .433 → POW 64
          "hitRate": 68,  // AVG .248 → HIT 68
          "contact": 66,  // OBP .328 → EYE 66
          "speed": 45
        }
      },
      {
        "name": "Ozzie Albies",
        "pos": "2B", 
        "type": "batter",
        "realStats": { "AVG": 0.258, "OBP": 0.310, "SLG": 0.407, "team": "ATL" },
        "stats": {
          "power": 60,    // SLG .407 → POW 60
          "hitRate": 72,  // AVG .258 → HIT 72  
          "contact": 60,  // OBP .310 → EYE 60
          "speed": 85
        }
      }
    ],
    "pitchers": {
      "startersRotation": [
        {
          "name": "Paul Skenes",
          "type": "pitcher",
          "stats": {
            "role": "Starter", 
            "power": 95,      // Elite strikeout rate
            "velocity": 98,   // Triple-digit fastball
            "control": 80,    // Still developing command
            "technique": 88,  // Great slider/splinker
            "maxStamina": 1000
          }
        }
      ],
      "reliever": {
        "name": "NL Reliever",
        "type": "pitcher",
        "stats": {
          "role": "Reliever",
          "power": 88,
          "velocity": 92,
          "control": 82,
          "technique": 86, 
          "maxStamina": 400
        }
      },
      "closer": {
        "name": "NL Closer",
        "type": "pitcher",
        "stats": {
          "role": "Closer",
          "power": 92,
          "velocity": 96,
          "control": 84,
          "technique": 90,
          "maxStamina": 200
        }
      }
    }
  }
];

export function getTeamById(id) {
    return ALL_TEAMS.find(team => team.id === id);
}