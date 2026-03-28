@echo off
cd /d C:\Users\TBrown\Desktop\rx-skin
del cleanup2.bat sidebar-check.txt 2>nul
git add -A
git commit -m "fix: resolve Sidebar.tsx merge conflict markers from rebase"
git push origin main
git log --oneline -3
del do-push.bat
