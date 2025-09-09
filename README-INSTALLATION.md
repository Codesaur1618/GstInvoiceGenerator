# GST Invoice System - Installation Guide

## Quick Start (Recommended)

### Option 1: Simple Batch File (Easiest)
1. **Download/Transfer** the entire `GSTWEB` folder to your target PC
2. **Double-click** `start-gst-app.bat`
3. **Wait** for the application to start (it will open in your browser)
4. **Done!** Your GST Invoice System is ready to use

### Option 2: Manual Installation
1. **Install Node.js** from https://nodejs.org/ (LTS version recommended)
2. **Open Command Prompt** in the GSTWEB folder
3. **Run**: `npm install`
4. **Run**: `npm run dev`
5. **Open** http://localhost:3000 in your browser

## System Requirements
- **Windows 10/11** (64-bit recommended)
- **Node.js** (version 16 or higher)
- **4GB RAM** minimum
- **500MB** free disk space

## Features Included
✅ **Custom invoice numbers** (no "INV-" prefix)
✅ **Tax type selection** (IGST vs CGST+SGST)
✅ **Custom GST rates** (5% to 28%)
✅ **Multiple items per invoice** with add/remove functionality
✅ **Simple text inputs** (no numeric up/down controls)
✅ **Accurate round-off calculations** (always positive)
✅ **Professional PDF generation** with correct calculations
✅ **Invoice history with sorting** (by date, amount, buyer, etc.)
✅ **Professional signature image** in all PDFs
✅ **Clean, professional design**

## File Structure
```
GSTWEB/
├── start-gst-app.bat          # Quick start script
├── package.json              # Dependencies and scripts
├── frontend/                 # React frontend
├── backend/                  # Express.js backend
├── db/                       # SQLite database
└── README-INSTALLATION.md    # This file
```

## Troubleshooting

### "Node.js is not installed"
- Download and install Node.js from https://nodejs.org/
- Restart your computer after installation
- Try running the batch file again

### "Port already in use"
- Close any other applications using port 3000 or 5000
- Restart your computer
- Try again

### "Permission denied"
- Run Command Prompt as Administrator
- Or right-click the batch file and select "Run as administrator"

### Application won't start
- Check if Windows Firewall is blocking the application
- Try running `npm install` manually first
- Check the console output for error messages

## Support
If you encounter any issues:
1. Check the console output for error messages
2. Ensure all files are present in the GSTWEB folder
3. Try running `npm install` manually
4. Restart your computer and try again

## Uninstallation
To remove the application:
1. Delete the entire GSTWEB folder
2. No additional cleanup required (no registry entries or system files)

---
**Your GST Invoice System is ready for professional use!** 🎉
