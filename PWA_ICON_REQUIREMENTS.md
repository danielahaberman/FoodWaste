# Windows PWA Icon Requirements Checklist

## ✅ Current Configuration Status

### 1. Icon File Requirements
- [ ] File exists: `public/appIcon.png`
- [ ] File size: **Must be exactly 512x512 pixels** (or larger, square)
- [ ] Format: PNG
- [ ] File is accessible at: `http://localhost:5173/appIcon.png` (or your dev URL)

### 2. Manifest.json Requirements
- [x] Icons array exists
- [x] 192x192 icon entry
- [x] 512x512 icon entry (REQUIRED for Windows)
- [x] Paths are absolute (`/appIcon.png`)
- [x] Type is `image/png`
- [x] Purpose includes `"any"`

### 3. HTML Requirements
- [x] Favicon link: `<link rel="icon" href="/appIcon.png">`
- [x] Manifest link: `<link rel="manifest" href="/manifest.json">`

## 🔧 Troubleshooting Steps

### Step 1: Verify Icon File
1. Open browser and navigate to: `http://localhost:5173/appIcon.png`
2. If you see the image → File is accessible ✅
3. If 404 error → File path is wrong ❌
4. Right-click image → Properties → Check dimensions
   - Must be **512x512** or larger (square)

### Step 2: Check Manifest in Browser
1. Open DevTools (F12)
2. Go to **Application** tab → **Manifest**
3. Check if icons are listed
4. Click on icon URLs to verify they load
5. Look for any errors in Console tab

### Step 3: Clear All Caches
1. **Browser Cache**: Ctrl+Shift+Delete → Clear cached images
2. **Service Worker**: DevTools → Application → Service Workers → Unregister
3. **Windows Icon Cache** (Run as Administrator):
   ```cmd
   ie4uinit.exe -show
   ```
   Or restart Windows Explorer:
   ```cmd
   taskkill /f /im explorer.exe
   start explorer.exe
   ```

### Step 4: Reinstall PWA
1. Uninstall existing PWA
2. Clear browser cache
3. Hard refresh page (Ctrl+Shift+R)
4. Reinstall PWA
5. Check if icon appears

## ⚠️ Common Issues

1. **Icon file is not 512x512**
   - Windows requires at least 512x512 pixels
   - Solution: Resize icon to exactly 512x512

2. **Icon path is wrong**
   - Manifest says `/appIcon.png` but file doesn't exist
   - Solution: Verify file is in `public/` folder

3. **Windows icon cache**
   - Windows caches icons and doesn't refresh
   - Solution: Rebuild icon cache or restart

4. **Installation drive**
   - PWA installed on non-C: drive
   - Solution: Change default app installation location to C: drive

## 📋 Quick Verification Commands

### Check if icon loads:
Open in browser: `http://localhost:5173/appIcon.png`

### Check manifest:
Open in browser: `http://localhost:5173/manifest.json`

### Verify icon dimensions (if you have ImageMagick):
```bash
identify public/appIcon.png
```

## ✅ Final Checklist Before Testing

- [ ] `appIcon.png` exists in `public/` folder
- [ ] Icon is exactly 512x512 pixels (or larger square)
- [ ] Icon is PNG format
- [ ] Manifest.json has 512x512 icon entry
- [ ] Icon path in manifest is `/appIcon.png`
- [ ] Icon loads when accessing directly in browser
- [ ] Cleared browser cache
- [ ] Cleared Windows icon cache
- [ ] Reinstalled PWA

