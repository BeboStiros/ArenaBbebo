@echo off
chcp 65001 >nul
title NEURA - تشغيل الموقع

rem ============================================
rem   نيورا — تشغيل الموقع على جهازك بضغطة واحدة
rem   الملف ده لازم يكون جوه مجلد المشروع
rem   (نفس المكان اللي فيه package.json)
rem ============================================

cd /d "%~dp0"

echo.
echo  ==========================================
echo    NEURA - نيورا
echo  ==========================================
echo.

if not exist "package.json" (
  echo  [X] ملف package.json مش موجود في المجلد ده.
  echo      اتأكد إنك فكّيت ضغط الملف المضغوط،
  echo      وإن start.bat جوه مجلد المشروع نفسه.
  echo.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo  [X] Node.js مش متثبت على الجهاز.
  echo      نزّله من https://nodejs.org  ^(اختار LTS^)
  echo      وبعد ما تخلّص، شغّل الملف ده تاني.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo  [1/2] بنزّل المكتبات... ^(مرة واحدة بس، ممكن تاخد دقيقة^)
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo  [X] حصلت مشكلة في التثبيت. جرّب تشغّل الملف تاني،
    echo      ولو كررت المشكلة ابعتلي نص الرسالة.
    echo.
    pause
    exit /b 1
  )
) else (
  echo  [1/2] المكتبات موجودة بالفعل — تخطّي التثبيت.
)

echo.
echo  [2/2] بنشغّل الموقع...
echo        المتصفح هيفتح لوحده على: http://localhost:5173
echo        عشان توقف: اقفل الشاشة دي أو اضغط Ctrl+C
echo.
call npm start

echo.
echo  تم إيقاف السيرفر.
pause
