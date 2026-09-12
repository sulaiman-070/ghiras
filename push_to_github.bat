@echo off
chcp 65001 > nul
echo ===================================================
echo     🌿 جاري رفع تطبيق غراس إلى GitHub...
echo ===================================================
echo.
cd /d "%~dp0"
set "PATH=%PATH%;C:\Users\amna-\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd;C:\Users\amna-\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin"
git add .
git commit -m "fix: correct Quran RTL page navigation order and auto advance"
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [✓] تم الرفع بنجاح إلى مستودعك على GitHub!
) else (
    echo [!] تأكد من تسجيل الدخول إلى GitHub أو إدخال رمز الوصول الشخصي (Personal Access Token).
)
echo.
pause
