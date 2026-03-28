@echo off
cd /d "C:\Users\TBrown\Desktop\rx-skin"
git add "src/lib/auth/config.ts" "src/app/(auth)/login/page.tsx"
git commit -m "feat: add env-based admin login alongside Microsoft SSO"
git push origin main
echo DONE
