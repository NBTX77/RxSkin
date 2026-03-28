@echo off
cd /d "C:\Users\TBrown\Desktop\rx-skin"
git add "src/lib/cw/normalizers.ts" "src/app/api/companies/route.ts" "src/app/api/schedule/route.ts" "src/app/(dashboard)/companies/page.tsx" "src/app/(dashboard)/dashboard/page.tsx" "src/app/(dashboard)/schedule/page.tsx"
git commit -m "fix: QA pass - fix Invalid Date, add companies API, wire dashboard, fix schedule labels"
git push origin main
echo DONE
