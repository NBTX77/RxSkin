@echo off
cd /d C:\Users\TBrown\Desktop\rx-skin
git add src/app/api/analytics/route.ts src/app/api/fleet/route.ts src/app/api/fleet/[vehicleId]/route.ts src/app/api/samsara/vehicles/route.ts src/app/api/samsara/drivers/route.ts src/app/api/samsara/hos/route.ts
git commit -m "fix: add force-dynamic to all Ops API routes for Next.js SSG compat"
git push origin main
echo DONE
