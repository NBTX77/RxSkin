@echo off
cd /d C:\Users\TBrown\Desktop\rx-skin
git add src/app/api/fleet/route.ts src/components/ops/FleetMap.tsx src/components/ops/AnalyticsDashboard.tsx src/components/ops/StatusDonut.tsx src/components/ops/PriorityDonut.tsx src/components/ops/WorkloadBars.tsx src/app/(dashboard)/ops/fleet-map/page.tsx
git commit -m "fix: Samsara error fallback to mock, Leaflet CSS import, light-mode charts"
git push origin main
echo DONE
