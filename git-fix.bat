@echo off
cd /d C:\Users\TBrown\Desktop\rx-skin
"C:\Program Files\Git\cmd\git.exe" add CLAUDE.md
"C:\Program Files\Git\cmd\git.exe" commit -m "docs: update CLAUDE.md status - deployment live at rxtech.app"
"C:\Program Files\Git\cmd\git.exe" push origin main
echo DONE