@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0wsmud2-browser-ext"

for /f "delims=" %%v in ('node -p "require('./manifest.json').version"') do (
    set VERSION=%%v
)

set OUTPUT_NAME=wsmud2-browser-ext-%VERSION%.zip

echo Building %OUTPUT_NAME%...

powershell -Command "Get-ChildItem -Path . -Force -Recurse | Where-Object { $_.FullName -notmatch '\\.git\\|node_modules|\\.gitignore|.*\\.log$' } | Compress-Archive -DestinationPath '..\%OUTPUT_NAME%' -Force; Write-Host 'Done! Output:' '%OUTPUT_NAME%'"

if %ERRORLEVEL% neq 0 (
    echo Error: Failed to create archive
    exit /b 1
)

endlocal