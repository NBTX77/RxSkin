@echo off
cd /d "C:\Users\TBrown\Desktop\rx-skin"
git add "src/lib/cw/credentials.ts" "src/app/api/tickets/route.ts" "src/app/api/tickets/[id]/route.ts" "src/app/api/tickets/[id]/notes/route.ts" "src/app/api/tickets/[id]/time-entries/route.ts" "src/app/api/schedule/route.ts"
git commit -m "feat: wire BFF API routes to ConnectWise client with mock data fallback"
git push origin main
echo DONE
