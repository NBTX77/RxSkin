@echo off
cd /d C:\Users\TBrown\Desktop\rx-skin
git add src/components/tickets/TicketListClient.tsx
git commit -m "fix: newline between const declarations in TicketListClient"
git push origin main
echo DONE
