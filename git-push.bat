@echo off
cd /d C:\Users\TBrown\Desktop\rx-skin
git config user.email "travislbrown@gmail.com"
git config user.name "Travis Brown"
git add -A
git commit -m "feat: initial RX Skin commit"
git branch -M main
git remote add origin https://github.com/NBTX77/RxSkin.git 2>nul
git push -u origin main
echo.
echo DONE
pause