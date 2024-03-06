import React, { useState, useEffect, memo } from 'react'
import useIpcRenderer from '../hooks/useIpcRenderer'
import styled from 'styled-components'
import { Button } from 'antd'
const { ipcRenderer } = window.require('electron')

export const AutoUpdateWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
  padding: 20px;
  overflow: hidden;
  box-sizing: border-box;
  .update-logo{
    width: 80px;
  }
  .download-message{
    margin-top: 10px;
    .download-message-item {
      margin-right: 20px;
      font-size: 16px;
      line-height: 16px;
      &:nth-last-child(1) {
        margin-right: 0px;
      }
      .download-message-item-label {
        color: #666;
        margin-right: 8px;
      }
      .download-message-item-value{
        color: rgb(127, 171, 278);
        font-weight: 700;
      }
    }
  }
  .downLoadButtonsBox{
    margin-top: 20px;
  }
  .progress-bar {
    width: 100%;
    padding: 0 10px;
    height: 24px;
    margin-top: 20px;
    cursor: pointer;
    .progress-bar__outer{
      width: 100%;
      height: 100%;
      background-color: #ccc;
      border-radius: 12px;
      position: relative;
      .progress-bar__inner{
        height: 100%;
        position: absolute;
        background-color: rgb(127, 171, 278);
        border-radius: 12px;
      }
    }
  }
  .download-percent{
    font-size: 26px;
    margin-top: 20px;
    color: #ccc;
  }
`

const messageObj = {
  error: '检查更新出错',
  checking: '正在检查更新…',
  updateAva: '发现新版本，是否需要下载',
  updateNotAva: '已经是最新版本',
  downloadProgress: '正在下载...',
  downloadCompleted: '下载完成，是否需要安装',
}

const AutoUpdate = memo(() => {
  const [downloadType, setDownloadType] = useState('')
  const [percent, setPercent] = useState(0)
  const [bytesPerSecond, setBytesPerSecond] = useState(0)
  const [total, setTotal] = useState(0)
  const [transferred, setTransferred] = useState(0)

  useEffect(() => {
    // 发送给主进程通知更新
    ipcRenderer.send('checkingUpdate')
  }, [])

  useIpcRenderer({
    // 正在检测是否有最新版本
    checking: () => {
      setDownloadType('checking')
    },
    // 当前已经是最新版本
    updateNotAva: () => {
      setDownloadType('updateNotAva')
    },
    // 发现新版本
    updateAva: () => {
      setDownloadType('updateAva')
    },
    /**
     * 正在下载显示进度条
     * progressObj
     * {
     *    bytesPerSecond // 网速
     *    delta
     *    percent // 已下载百分比
     *    total // 包大小
     *    transferred // 已下载大小
     * }
    */
    downloadProgress: (event, progressObj) => {
      setDownloadType('downloadProgress')
      setPercent(progressObj.percent)
      setBytesPerSecond(progressObj.bytesPerSecond)
      setTotal(progressObj.total)
      setTransferred(progressObj.transferred)
    },
    // 下载完成
    downloadCompleted: () => {
      setDownloadType('downloadCompleted')
    }
  })

  // 发给组进程更新事件
  const sendDownloadUpdate = () => {
    ipcRenderer.send('downloadUpdate')
  }

  // 关闭下载对话框
  const sendCloseDownDialog = () => {
    ipcRenderer.send('closeDownDialog')
  }

  // 发起安装
  const sendInstall = () => {
    ipcRenderer.send('install')
  }

  const downloadMessage = []

  if (downloadType === 'downloadProgress') {
    downloadMessage.push(
      <>
        <div className='download-message'>
          <span className='download-message-item'>
            <span className='download-message-item-label'>网速:</span>
            <span className='download-message-item-value'>{bytesPerSecond / 1024}</span>
          </span>
          <span className='download-message-item'>
            <span className='download-message-item-label'>包大小:</span>
            <span className='download-message-item-value'>{total}</span>
          </span>
          <span className='download-message-item'>
            <span className='download-message-item-label'>已下载大小:</span>
            <span className='download-message-item-value'>{transferred}</span>
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar__outer">
            <div className="progress-bar__inner" style={{ width: `${percent}%` }}>
            </div>
          </div>
        </div>
        <div className='download-percent'>
          {percent}%
        </div>
      </>
    )
  } else {
    downloadMessage.push(
      <div className='download-message'>
        <span>{ downloadType ? messageObj[downloadType] : '' }</span>
      </div>
    )
    const CloseButton = <Button onClick={sendCloseDownDialog}>否</Button>
    if ( downloadType === 'updateNotAva') {
      downloadMessage.push(
        <div className='downLoadButtonsBox'>
          <Button onClick={sendCloseDownDialog} style={{ marginLeft: '20px' }} type='primary'>是</Button>
        </div>
      )
    }
    if (downloadType === 'updateAva') {
      downloadMessage.push(
        <div className='downLoadButtonsBox'>
          {
            CloseButton
          }
          <Button onClick={sendDownloadUpdate} style={{ marginLeft: '20px' }} type='primary'>是</Button>
        </div>
      )
    }
    if (downloadType === 'downloadCompleted') {
      downloadMessage.push(
        <div className='downLoadButtonsBox'>
          {
            CloseButton
          }
          <Button onClick={sendInstall} style={{ marginLeft: '20px' }} type='primary'>是</Button>
        </div>
      )
    }
  }

  return (
    <AutoUpdateWrapper>
      <img className="update-logo" src='static/update.svg' alt="logo" />
      {
        downloadMessage
      }
    </AutoUpdateWrapper>
  )
})

export default AutoUpdate;