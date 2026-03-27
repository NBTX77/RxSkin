@echo off
cd /d C:\Users\TBrown\Desktop\rx-skin
git add -A
git commit -m "fix: replace getServerSession with auth() in ticket detail route"
git push origin main
echo DONE
pause