@echo off
cd /d C:\Users\TBrown\Desktop\rx-skin
git add "src/app/(dashboard)/tickets/page.tsx" "src/app/(dashboard)/layout.tsx"
git commit -m "fix: remove duplicate margin and max-width causing content gap"
git push origin main
pause
