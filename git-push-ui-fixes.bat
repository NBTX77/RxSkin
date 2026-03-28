@echo off
cd /d C:\Users\TBrown\Desktop\rx-skin
git add "src/app/(dashboard)/tickets/page.tsx" "src/app/(dashboard)/schedule/page.tsx"
git commit -m "fix: align tickets and schedule pages with actual API response shapes - Tickets: map id to ticket number display, updatedAt to formatted date column - Schedule: use start/end/ticketSummary/memberName instead of dateStart/dateEnd/title/resource Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
git push origin main
echo DONE
