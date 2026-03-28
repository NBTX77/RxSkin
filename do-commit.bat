@echo off
cd /d C:\Users\TBrown\Desktop\rx-skin
git add -A
git commit -m "chore: remove stale batch files and build artifacts"
git push origin main
git log --oneline -3
del do-commit.bat
