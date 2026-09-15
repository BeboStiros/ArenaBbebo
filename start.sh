#!/usr/bin/env bash
# ============================================
#   نيورا — تشغيل الموقع على الماك/لينكس بضغطة واحدة
#   الاستخدام:  ./start.sh        (أو دبل كليك على macOS)
# ============================================

cd "$(dirname "$0")" || exit 1

echo
echo "  =========================================="
echo "    NEURA - نيورا"
echo "  =========================================="
echo

if [ ! -f package.json ]; then
  echo "  [X] ملف package.json مش موجود في المجلد ده."
  echo "      اتأكد إنك فكّيت ضغط الملف المضغوط الأول."
  echo
  read -r -p "  اضغط Enter للخروج..." _
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "  [X] Node.js مش متثبت. نزّله من https://nodejs.org (اختار LTS)"
  echo
  read -r -p "  اضغط Enter للخروج..." _
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "  [1/2] بنزّل المكتبات... (مرة واحدة بس)"
  echo
  if ! npm install; then
    echo
    echo "  [X] حصلت مشكلة في التثبيت."
    read -r -p "  اضغط Enter للخروج..." _
    exit 1
  fi
else
  echo "  [1/2] المكتبات موجودة بالفعل — تخطّي التثبيت."
fi

echo
echo "  [2/2] بنشغّل الموقع... المتصفح هيفتح على http://localhost:5173"
echo "        عشان توقف: Ctrl+C"
echo
npm start
