@echo off
cd /d C:\Users\TBrown\Desktop\rx-skin
git add "src/app/(dashboard)/tickets/page.tsx"
git commit -m "fix: ticket table vertical alignment and column layout - Add table-fixed with colgroup for consistent column widths - Add align-top to all cells so content aligns to top of row - Truncate summary and company columns to prevent row height bloat - Add whitespace-nowrap to status, priority, and updated columns Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
git push origin main
echo DONE
