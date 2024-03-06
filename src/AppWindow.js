const { BrowserWindow } = require('electron')
const isDev = require('electron-is-dev')

class AppWindow extends BrowserWindow {
  constructor(config, urlLocation) {
    const basicConfig = {
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration:true,       // 为了解决require 识别问题
        contextIsolation: false,
        enableRemoteModule: true
      }
    }
    const finalConfig = { ...basicConfig, ...config }
    super(finalConfig)
    if (isDev) {
      // 使用http协议
      this.loadURL(urlLocation)
    } else {
      // 使用file协议
      const [fileUrl, hash] = urlLocation.split('/#')
      this.loadFile(fileUrl, {
        hash: hash
      })
    }
    this.once('ready-to-show', () => {
      this.show()
    })
  }
}

module.exports = AppWindow