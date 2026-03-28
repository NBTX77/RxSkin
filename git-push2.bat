@echo off
cd /d C:\Users\TBrown\Desktop\rx-skin
git add src/app/(dashboard)/tickets/page.tsx
git commit -m "fix: ticket table column widths use inline styles for reliable rendering Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
git push origin main
echo DONE
