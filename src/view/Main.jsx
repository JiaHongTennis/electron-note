import React, { useState } from 'react';
import styled from 'styled-components';
import SimpleMDE from "react-simplemde-editor";
import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "easymde/dist/easymde.min.css";
import update from 'immutability-helper';
import fileHelper from '../utils/fileHelper'
import { createGuid } from '../utils/common';
import useIpcRenderer from '../hooks/useIpcRenderer'
import { Tabs } from 'antd';
import FileSearch from './FileSearch'
import { memo } from 'react'

const { join, basename, extname, dirname } = window.require('path')
const remote = window.require('@electron/remote')
const Store = window.require('electron-store')
const fileStore = new Store({ 'name': 'Files Data' })

const MainWrapper = styled.section`
  width: 100%;
  height: 100%;
  display: flex;
  .fileSearchBox-left{
    width: 30%;
    height: 100%;
  }
  .fileSearchBox-right{
    width: 70%;
    height: 100%;
    .tabListWrapper-header{
      width: 100%;
      height: 60px;
    }
    .start-page{
      font-size: 30px;
      height: 300px;
      line-height: 300px;
      color: #ccc;
      text-align: center;
    }
  }
`

// 文件持久化
const saveFilesToStore = (files) => {
  // 将文件列表数据格式化为需要持久化的数据
  const storeFiles = files.map(fileItem => {
    const { id, path, title, createdAt } = fileItem
    return {
      id,
      path,
      title,
      createdAt
    }
  })
  fileStore.set('files', storeFiles)
}


const Main = memo(() => {

  // defaultFiles 默认文件列表
  const [ files, setFiles ] = useState(fileStore.get('files') || {})
  // 当前显示的文件
  const [ activeFileID, setActiveFileID ] = useState('')
  // 当前打开的文件
  const [ openedFileIDs, setOpenedFileIDs ] = useState([])
  // 当前未保存的文件
  const [ unsavedFileIDs, setUnsavedFileIDs ] = useState([])

  // 拿到电脑文档地址
  const savedLocation = remote.app.getAppPath('documents')

  // 遍历出当前打开的文件
  const openedFiles = openedFileIDs.map(fileId => {
    const fileItem = files.find(fileItem => fileItem.id === fileId)
    return {
      ...fileItem,
      label: (
        <>
          <span>{fileItem.title}</span>
          { unsavedFileIDs.includes(fileItem.id) ? <div style={{display: 'inline-block', width: '12px', height: '12px', backgroundColor: 'red', borderRadius: '12px'}}></div> : '' }
        </>
      ),
      key: fileItem.id
    }
  })

  // 当前选中的文件
  const activeFile = files.find(file => {
    return file.id === activeFileID
  })

  const onChange = (key) => {
    console.log(key)
  }

  // 点击文件列表
  const fileClick = (fileId) => {
    // 根据id拿到文件对象
    const { fileItem, fileIndex } = getFileItemById(fileId)
    if (fileItem) {
      // 如果未读取
      if (!fileItem.isLoaded && fileItem.path) {
        // 读取文件内容
        fileHelper.readFile(fileItem.path).then(value => {
          //修改文件数据
          const newFiles = update(files, { [fileIndex]: { isLoaded: { $set: true }, body: { $set: value } } })
          setFiles(newFiles)
        })
      }
    }
    // 设置当前选中
    setActiveFileID(fileId)
    // 添加到列表
    if (!openedFileIDs.includes(fileId)) {
      setOpenedFileIDs([...openedFileIDs, fileId])
    }
  }

  // 切换tab页
  const onTabClickHandel = (fileId) => {
    setActiveFileID(fileId)
  }

  // 根据文件id查找文件列表对象
  const getFileItemById = (fileId) => {
    let curFileIndex = -1
    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      if (fileItem.id === fileId) {
        curFileIndex = i
        break
      }
    }
    if (curFileIndex > -1) {
      return { fileItem: files[curFileIndex], fileIndex: curFileIndex }
    }
    return null
  }

  // 编辑tab页面
  const onEdit = (fileId, action) => {
    if (action === 'remove') {
      // 从列表中删除
      // 找到下表
      const openedFileIDIndex = openedFileIDs.indexOf(fileId)
      if (openedFileIDIndex > -1) {
        // 存在id
        const newOpenedFileIDs = update(openedFileIDs, { $splice: [[openedFileIDIndex, 1]] })
        setOpenedFileIDs(newOpenedFileIDs)
        if (activeFileID === fileId) {
          // 关闭的是当前点额id
          if (newOpenedFileIDs.length > 0) {
            // 还有tab页，选择第一个
            setActiveFileID(newOpenedFileIDs[0])
          } else {
            // 选择取消选中
            setActiveFileID('')
          }
        }
      }
    }
  }

  // 编辑器文本修改
  const fileBodyChange = (value) => {
    // 找出下标
    let curFileIndex = -1
    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      if (fileItem.id === activeFile.id) {
        curFileIndex = i
        break
      }
    }
    if (curFileIndex > -1) {
      setFiles(update(files, { [curFileIndex]: { body: { $set: value } } }))
    }
    if (!unsavedFileIDs.includes(activeFile.id)) {
      // 添加为未保存
      setUnsavedFileIDs(update(unsavedFileIDs, { $push: [activeFile.id] }))
    }
  }

  // 修改文件名次
  const changeFileTitle = (fileItem, value) => {
    // 找出下标
    let curFileIndex = -1
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (fileItem.id === file.id) {
        curFileIndex = i
        break
      }
    }
    if (curFileIndex > -1) {
      const newPath = join(fileItem.isNew ? savedLocation : dirname(fileItem.path), `${value}.md`)
      // isNew
      const newFiles = update(files, { [curFileIndex]: { title: { $set: value }, isNew: { $set: false }, path: { $set: newPath } }})
      if (fileItem.isNew) {
        // 输出文件
        fileHelper.writeFile(newPath, fileItem.body).then(() => {
          setFiles(newFiles)
          // 文件持久化保存
          saveFilesToStore(newFiles)
        })
      } else {
        fileHelper.renameFile(fileItem.path, newPath).then(() => {
          setFiles(newFiles)
          // 文件持久化保存
          saveFilesToStore(newFiles)
        })
      }
    }
  }

  // 删除文件列表
  const deleteHandel = (fileId) => {
    let curFileIndex = -1
    for (let i = 0; i < files.length; i++) {
      const fileItem = files[i];
      if (fileItem.id === fileId) {
        curFileIndex = i
        break
      }
    }
    if (curFileIndex > -1) {

      const newFiles = update(files, { $splice: [[curFileIndex, 1]] })
      setFiles(newFiles)
      const openedFileIDIndex = openedFileIDs.indexOf(fileId)
      if (openedFileIDIndex > -1) {
        const newOpenedFileIDs = update(openedFileIDs, { $splice: [[openedFileIDIndex, 1]] })
        setOpenedFileIDs(newOpenedFileIDs)
        if (fileId === activeFile.id) {
          // 关闭的是当前点额id
          if (newOpenedFileIDs.length > 0) {
            // 还有tab页，选择第一个
            setActiveFileID(newOpenedFileIDs[0])
          } else {
            // 选择取消选中
            setActiveFileID('')
          }
        }
      }
      // 持久化数据
      saveFilesToStore(newFiles)
      // 删除真实文件
      if (files[curFileIndex].path) {
        fileHelper.deleteFile(files[curFileIndex].path)
      }
    }
  }

  // 新增文件
  const createItem = (newFile) => {
    setFiles(update(files, { $push: [newFile] }))
    // 设置选中列表
    setOpenedFileIDs(update(openedFileIDs, { $push: [newFile.id] }))
    // 设置当前选中
    setActiveFileID(newFile.id)
  }

  // 保存文本
  const saveFileBody = () => {
    if (activeFile) {
      // 保存新文本
      fileHelper.writeFile(join(activeFile.path), activeFile.body).then(() => {
        setUnsavedFileIDs(unsavedFileIDs.filter(id => id !== activeFile.id))
      })
    }
  }

  // 点击导出
  const importFiles = () => {
    // 弹出选择框,选择文件并且允许多选
    remote.dialog.showOpenDialog({
      title: '选择导入文件',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Markdown files', extensions: ['md'] }
      ]
    }).then(({ canceled, filePaths }) => {
      if (!canceled) {
        // 没有取消,得到选中文件数组filePaths
        // 首先过滤文件列表中已经存在的，如果存在则不重复添加
        const filterPaths = filePaths.filter(path => {
          const alreadyAdded = files.find(file => {
            return file.path === path
          })
          // 如果存在,则返回false
          return !alreadyAdded
        })
        // 格式对象信息
        const importFilesArr = filterPaths.map(path => {
          return {
            id: createGuid(),
            title: basename(path, extname(path)),
            path
          }
        })
        // 添加进files
        const newFiles = update(files, { $push: importFilesArr })
        setFiles(newFiles)
        saveFilesToStore(newFiles)
        if (importFilesArr.length > 0) {
          remote.dialog.showMessageBox({
            type: 'info',
            title: '提示',
            message: `成功导出了${importFilesArr.length}个文件`
          })
        }
      }
    })
  }

  // 监听主进程传出的事件
  useIpcRenderer({
    // 新增文件
    'save-edit-file': saveFileBody
  })

  return (
    <MainWrapper>
      <div className='fileSearchBox-left'>
        <FileSearch importFiles={importFiles} createItem={createItem} deleteHandel={deleteHandel} changeText={changeFileTitle} onFileClick={fileClick} files={files}></FileSearch>
      </div>
      <div className='fileSearchBox-right'>
        {
          !activeFile && (
            <div className='start-page'>
              选择或者创建新的 Markdown 文档
            </div>
          )
        }
        {
          activeFile && (
            <>
              <div className='tabListWrapper-header'>
                <Tabs
                  activeKey={activeFileID}
                  onTabClick={onTabClickHandel}
                  defaultActiveKey="1"
                  type="editable-card"
                  items={openedFiles}
                  onEdit={onEdit}
                  onChange={onChange} />
              </div>
              <div className='tabListWrapper-content'>
              <AceEditor
                placeholder="Placeholder Text"
                mode="markdown"
                theme="terminal"
                name="blah2"
                key={activeFile && activeFile.id}
                onChange={fileBodyChange}
                fontSize={14}
                showPrintMargin={true}
                showGutter={true}
                highlightActiveLine={true}
                value={activeFile && activeFile.body}
                setOptions={{
                  enableBasicAutocompletion: false,
                  enableLiveAutocompletion: false,
                  enableSnippets: false,
                  showLineNumbers: true,
                  tabSize: 2,
                }} />
                {/* <SimpleMDE
                  options={{
                    minHeight: '515px'
                  }}
                  onChange={fileBodyChange}
                  key={activeFile && activeFile.id}
                  value={activeFile && activeFile.body}
                  /> */}
              </div>
            </>
          )
        }
      </div>
    </MainWrapper>
  );
})

export default Main