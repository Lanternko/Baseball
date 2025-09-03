@echo off
echo 🔄 Syncing core models from Baseball_algo to Baseball simulation...

echo Copying constants.js...
copy "D:\CODING\Baseball_algo\src\js\constants.js" "D:\CODING\baseball\js\shared_constants.js"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to sync constants.js
    goto :error
)

echo Copying probability_model.js...
copy "D:\CODING\Baseball_algo\src\js\probability_model.js" "D:\CODING\baseball\js\shared_probability_model.js"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to sync probability_model.js
    goto :error
)

echo Copying ovr_calculator.js...
copy "D:\CODING\Baseball_algo\src\js\ovr_calculator.js" "D:\CODING\baseball\js\shared_ovr_calculator.js"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to sync ovr_calculator.js
    goto :error
)

echo Copying woba_ovr_mapping.js...
copy "D:\CODING\Baseball_algo\src\js\woba_ovr_mapping.js" "D:\CODING\baseball\js\shared_woba_ovr_mapping.js"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to sync woba_ovr_mapping.js
    goto :error
)

echo ✅ All core models synced successfully!
echo 📊 Baseball simulation now uses latest Baseball_algo models
echo 🚀 Ready for GitHub commit and deployment
goto :end

:error
echo ❌ Sync failed! Please check file paths and try again.
pause
exit /b 1

:end
echo.
echo.
echo 🏆 OPTIONAL: Regenerate team data from latest MLB stats
echo Run convert_real_stats.html in browser to update teamsdata.js
echo (Only needed if you want to refresh player stats or add new players)
echo.
echo 💡 Next steps:
echo 1. Test the baseball simulation locally
echo 2. Commit and push changes to GitHub  
echo 3. GitHub Pages will auto-deploy the updated simulation
echo.
echo 🌟 Your AL vs NL simulation now uses:
echo   • Real 2024 MLB player stats (Aaron Judge, Acuña Jr., etc.)
echo   • Advanced Baseball_algo simulation models
echo   • Tarik Skubal vs Paul Skenes pitching matchup
pause