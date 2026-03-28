@echo off
cd /d C:\Users\TBrown\Desktop\rx-skin
git add src/app/api/fleet/[vehicleId]/route.ts
git commit -m "fix: resolve CacheValue type error in fleet vehicleId route"
git push origin main
echo DONE
