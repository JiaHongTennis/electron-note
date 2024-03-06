const isDev = require('electron-is-dev')
const path = require('path')
const { autoUpdater } = require("electron-updater")
const { ipcMain } = require('electron')
const AppWindow = require('./src/AppWindow')
const { urlLocation } = require('./src/config/settings')
const remote = require('@electron/remote/main')
let autoUpdateWindow

// 自动更新
module.exports = {
  autoUpdaterHandel (mainWindow) {
    // 发送事件给autoUpdateWindow的renderer进程，提示更新信息
    function sendUpdateMessage({ cmd, data = {} }) {
      autoUpdateWindow.webContents.send(cmd, data)
    }
    // 开发环境修改配置地址
    if (isDev) {
      autoUpdater.forceDevUpdateConfig = true
      autoUpdater.updateConfigPath = path.join(__dirname, './dev-app-update.yml')
    }
    // 自动下载设置为false
    autoUpdater.autoDownload = false
    // 监听渲染进程通知查询更新
    ipcMain.on('checkingUpdate', () => {
      // 发起查询是否有最新版本
      autoUpdater.checkForUpdates()
      // 更新状态
      sendUpdateMessage({ cmd: 'checking' })
    })
    // 监听渲染进程通知下载
    ipcMain.on('downloadUpdate', () => {
      autoUpdater.downloadUpdate()
    })
    // 监听下载对话框关闭
    ipcMain.on('closeDownDialog', () => {
      autoUpdateWindow && autoUpdateWindow.destroy()
    })
    // 监听渲染进程通知安装
    ipcMain.on('install', () => {
      autoUpdater.quitAndInstall()
      mainWindow.destroy()
    })
    // 检测更新按钮点击弹出更新窗口
    ipcMain.on('checkForUpdate', () => {
      // 弹出更新窗口
      autoUpdateWindow = new AppWindow({
        width: 600,
        height: 400,
        parent: mainWindow,
        modal: true,
        autoHideMenuBar: true,
      }, `${urlLocation}/#/autoUpdate`)
      remote.enable(autoUpdateWindow.webContents)
    })
    // 监听事件-发现新版本
    autoUpdater.on('update-available', () => {
      // 更新状态
      sendUpdateMessage({ cmd: 'updateAva' })
    })
    // 当前是最新版本
    autoUpdater.on('update-not-available', () => {
      sendUpdateMessage({ cmd: 'updateNotAva' })
    })
    // 更新失败
    autoUpdater.on('error', function (error) {
      sendUpdateMessage({ cmd: 'error' })
    })
    // 更新下载进度事件
    autoUpdater.on('download-progress', function (progressObj) {
      sendUpdateMessage({ cmd: 'downloadProgress', data: progressObj })
    })
    // 下载完成
    autoUpdater.on('update-downloaded', function () {
      sendUpdateMessage({ cmd: 'downloadCompleted' })
    })
  }
}