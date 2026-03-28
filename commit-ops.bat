@echo off
cd /d C:\Users\TBrown\Desktop\rx-skin
del .git\HEAD.lock 2>nul
del .git\index.lock 2>nul
git commit -m "feat: add Ops Hub with Fleet Map Analytics Schedule Holds"
git push origin main
echo PUSH COMPLETE