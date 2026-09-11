@echo off
chcp 65001 > nul
echo ===================================================
echo     🌿 جاري رفع تطبيق غراس إلى GitHub...
echo ===================================================
echo.
cd /d "c:\Users\sulim\Desktop\Quran app"
"C:\Users\sulim\AppData\Local\Programs\Git\cmd\git.exe" push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [✓] تم الرفع بنجاح إلى مستودعك على GitHub!
) else (
    echo [!] تأكد من إنشاء المستودع أولاً باسم ghiras على github.com/new
)
echo.
pause
