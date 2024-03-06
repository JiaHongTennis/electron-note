import { useEffect, useRef } from 'react'
const remote = window.require('@electron/remote')
const { Menu, MenuItem } = remote

// 右键点击
export const useContextMenu = (itemArr, targetSelector, deps) => {

  const clickedElement = useRef()

  useEffect(() => {
    const menu = new Menu()
    itemArr.forEach(item => {
      menu.append(new MenuItem(item))
    })

    // 右键事件
    const contextmenuHandel = (e) => {
      // 判断点击的节点是否在targetSelector下
      if (document.querySelector(targetSelector).contains(e.target)) {
        clickedElement.current = e.target
        menu.popup({ window: remote.getCurrentWindow() })
      }
    }

    window.addEventListener('contextmenu', contextmenuHandel)
    return () => {
      window.removeEventListener('contextmenu', contextmenuHandel)
    }
  }, deps)

  return clickedElement
}