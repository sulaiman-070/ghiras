@echo off
chcp 65001 > nul
echo ===================================================
echo     🌿 جاري رفع تطبيق غراس إلى GitHub...
echo ===================================================
echo.

cd /d "%~dp0"
set "GIT_EXE=C:\Users\amna-\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd\git.exe"
set "PATH=%PATH%;C:\Users\amna-\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd;C:\Users\amna-\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\mingw64\bin"

"%GIT_EXE%" add .
"%GIT_EXE%" commit -m "fix: correct Quran RTL page navigation order and auto advance"
"%GIT_EXE%" push -u origin main

echo.
if %ERRORLEVEL% EQU 0 goto :success
goto :failure

:success
echo [✓] تم الرفع بنجاح إلى مستودعك على GitHub!
goto :end

:failure
echo [!] لم يكتمل الرفع. يرجى التأكد من صلاحيات الوصول أو إدخال رمز Personal Access Token.
goto :end

:end
echo.
pause
