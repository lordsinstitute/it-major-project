@echo off
echo ============================================
echo    KisanSathi - AI Farmer Support System
echo ============================================
echo.
echo Starting Django development server...
echo.
echo Make sure you have:
echo   1. MySQL running with kisansathi_db created
echo   2. All packages installed (pip install -r requirements.txt)
echo   3. Migrations applied (python manage.py migrate)
echo.
echo Opening browser at http://127.0.0.1:8000
echo Press Ctrl+C to stop the server.
echo.
start "" "http://127.0.0.1:8000"
python manage.py runserver
pause
