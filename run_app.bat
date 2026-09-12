@echo off
chcp 65001 > nul
echo ===================================================
echo     🌿 تشغيل تطبيق غِراس (Ghiras App)
echo ===================================================
echo.
cd /d "%~dp0"
echo [1/2] جاري فتح التطبيق في المتصفح...
start http://localhost:5500
echo [2/2] جاري تشغيل الخادم المحلي على المنفذ 5500...
echo.
set "PATH=%PATH%;C:\Users\amna-\AppData\Local\OpenAI\Codex\runtimes\cua_node\2fb562745e6d66f0\bin"
node server.js
pause
