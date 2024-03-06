const isDev = require('electron-is-dev')
const path = require('path')

// 加载窗口页面
const urlLocation = isDev ? 'http://localhost:3000' : `${path.join(__dirname, './index.html')}`

module.exports = {
  urlLocation
}