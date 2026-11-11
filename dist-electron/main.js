import { BrowserWindow, app } from "electron";
import { join } from "node:path";
// electron/main.ts
function createWindow() {
	const window = new BrowserWindow({
		width: 1440,
		height: 920,
		minWidth: 1050,
		minHeight: 680,
		title: "LingoPDF",
		backgroundColor: "#f7f8fa",
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true
		}
	});
	const devServerUrl = process.env.VITE_DEV_SERVER_URL;
	if (devServerUrl) window.loadURL(devServerUrl);
	else window.loadFile(join(app.getAppPath(), "dist", "index.html"));
}
app.whenReady().then(() => {
	createWindow();
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
export {};
