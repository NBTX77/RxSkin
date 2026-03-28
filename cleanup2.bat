@echo off
cd /d C:\Users\TBrown\Desktop\rx-skin
del sidebar-check.txt 2>nul
del do-commit.bat 2>nul
del fix-build.bat 2>nul
git rm src\build-trigger.ts 2>nul
git add -A
git commit -m "chore: remove temp files"
git push origin main
git log --oneline -3
del cleanup2.bat
