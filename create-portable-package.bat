@echo off
echo Creating Portable GST Invoice System Package...
echo.

REM Create portable package directory
set PACKAGE_DIR=GST-Invoice-System-Portable
if exist "%PACKAGE_DIR%" rmdir /s /q "%PACKAGE_DIR%"
mkdir "%PACKAGE_DIR%"

echo Copying application files...
xcopy /E /I /Y "frontend" "%PACKAGE_DIR%\frontend"
xcopy /E /I /Y "backend" "%PACKAGE_DIR%\backend"
xcopy /E /I /Y "db" "%PACKAGE_DIR%\db"
copy /Y "package.json" "%PACKAGE_DIR%\"
copy /Y "package-lock.json" "%PACKAGE_DIR%\"
copy /Y "start-gst-app.bat" "%PACKAGE_DIR%\"
copy /Y "README-INSTALLATION.md" "%PACKAGE_DIR%\"

echo Creating installation script...
echo @echo off > "%PACKAGE_DIR%\INSTALL.bat"
echo echo Installing GST Invoice System... >> "%PACKAGE_DIR%\INSTALL.bat"
echo echo. >> "%PACKAGE_DIR%\INSTALL.bat"
echo echo Checking Node.js installation... >> "%PACKAGE_DIR%\INSTALL.bat"
echo node --version ^>nul 2^>^&1 >> "%PACKAGE_DIR%\INSTALL.bat"
echo if %%errorlevel%% neq 0 ^( >> "%PACKAGE_DIR%\INSTALL.bat"
echo     echo Error: Node.js is not installed >> "%PACKAGE_DIR%\INSTALL.bat"
echo     echo Please install Node.js from https://nodejs.org/ >> "%PACKAGE_DIR%\INSTALL.bat"
echo     pause >> "%PACKAGE_DIR%\INSTALL.bat"
echo     exit /b 1 >> "%PACKAGE_DIR%\INSTALL.bat"
echo ^) >> "%PACKAGE_DIR%\INSTALL.bat"
echo echo Installing dependencies... >> "%PACKAGE_DIR%\INSTALL.bat"
echo npm install >> "%PACKAGE_DIR%\INSTALL.bat"
echo echo. >> "%PACKAGE_DIR%\INSTALL.bat"
echo echo Installation complete! >> "%PACKAGE_DIR%\INSTALL.bat"
echo echo Run start-gst-app.bat to start the application. >> "%PACKAGE_DIR%\INSTALL.bat"
echo pause >> "%PACKAGE_DIR%\INSTALL.bat"

echo.
echo Creating ZIP package...
if exist "GST-Invoice-System-Portable.zip" del "GST-Invoice-System-Portable.zip"
powershell Compress-Archive -Path "%PACKAGE_DIR%\*" -DestinationPath "GST-Invoice-System-Portable.zip"

echo.
echo ✅ Portable package created successfully!
echo.
echo Package contents:
echo - GST-Invoice-System-Portable.zip (Ready to transfer)
echo - INSTALL.bat (Run this on target PC first)
echo - start-gst-app.bat (Run this to start the app)
echo - README-INSTALLATION.md (Installation guide)
echo.
echo To transfer to another PC:
echo 1. Copy GST-Invoice-System-Portable.zip to target PC
echo 2. Extract the ZIP file
echo 3. Run INSTALL.bat (installs dependencies)
echo 4. Run start-gst-app.bat (starts the application)
echo.
pause
