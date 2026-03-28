@echo off
cd /d C:\Users\TBrown\Desktop\rx-skin
git add package.json src/app/api/tickets/route.ts src/components/layout/MobileNav.tsx src/components/layout/Sidebar.tsx src/lib/cw/client.ts
git commit -m "feat: add Ops Hub - Fleet Map, Analytics, Schedule Holds"
echo COMMIT_DONE
