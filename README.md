# Seoul Snap — Korean-style Photobooth

A local browser photobooth MVP made with HTML, CSS, and vanilla JavaScript.

## Features
- Webcam preview
- Automatic four-photo countdown session
- Retake individual photos
- Classic vertical strip and four-photo grid layouts
- Cream, pink, sage, blue, and black frames
- Original, soft, monochrome, and warm filters
- Caption and PNG download
- Responsive layout for desktop and mobile browsers

## Run on Windows

Camera access usually requires `localhost` or HTTPS. Do not just open `index.html` with a `file://` URL.

### Option A: Python local server
1. Install Python if it is not already installed.
2. Open PowerShell in this folder.
3. Run:

   ```powershell
   python -m http.server 8000
   ```

4. Open this address in your browser:

   http://localhost:8000

5. Click **Turn on camera** and allow camera permission.

Stop the server with `Ctrl+C` in PowerShell.

### Option B: VS Code Live Server
If you have the VS Code Live Server extension, right-click `index.html` and choose **Open with Live Server**. Allow camera access when prompted.

## Notes
- Photos are processed in the browser and are not uploaded to a server.
- Camera access requires browser permission.
- Use a supported modern browser such as Chrome or Edge.
- This is a starter MVP. Native iPhone app packaging, cloud storage, stickers, and more advanced editing are not included.
