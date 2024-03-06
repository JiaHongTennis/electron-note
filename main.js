const { app, Menu } = require('electron')
const remote = require('@electron/remote/main')
const template = require('./src/menuTemplate')
const Store = require('electron-store')
const AppWindow = require('./src/AppWindow')
const isDev = require('electron-is-dev')
const { autoUpdaterHandel } = require('./autoUpdater')
const { urlLocation } = require('./src/config/settings')
let mainWindow

// 初始化electron-store
Store.initRenderer();

let menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

// 监听electron完成加载
app.whenReady().then(() => {
  // 主窗口
  mainWindow = new AppWindow({
    width: 1200,
    height: 800,   
  }, `${urlLocation}/#/main`)
  // 支持remote
  remote.initialize()
  remote.enable(mainWindow.webContents)
  // 打开调试工具
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }
  // 自动更新
  autoUpdaterHandel(mainWindow)
})