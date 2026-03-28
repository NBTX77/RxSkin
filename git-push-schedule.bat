@echo off
cd /d C:\Users\TBrown\Desktop\rx-skin
git add CLAUDE.md "src/app/(dashboard)/schedule/page.tsx"
git commit -m "feat: add calendar schedule view with day/week/month modes"
git push origin main
pause
