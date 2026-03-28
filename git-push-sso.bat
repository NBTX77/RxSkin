@echo off
cd /d "C:\Users\TBrown\Desktop\rx-skin"
git add "src/lib/auth/config.ts" "src/app/(auth)/login/page.tsx"
git commit -m "feat: replace demo credentials with Microsoft Entra ID SSO-only login"
git push origin main
echo DONE
