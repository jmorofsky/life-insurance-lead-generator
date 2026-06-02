@echo off
cd /d "%~dp0"

echo Building Python executable...
pyinstaller --onefile --distpath . --add-data "../../appconfig.cfg;." ..\\..\\data-generator\\main.py

if %errorlevel% neq 0 (
  echo PyInstaller build failed.
  exit /b %errorlevel%
)

echo Build complete.
