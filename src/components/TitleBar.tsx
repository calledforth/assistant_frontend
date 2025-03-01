"use client"

import { getCurrentWindow } from "@tauri-apps/api/window"
import { Minus, Square, X } from "lucide-react"

export function TitleBar() {
  const appWindow = getCurrentWindow()

  return (
    <div data-tauri-drag-region className="flex items-center justify-between bg-neutral-900 text-white h-6 px-4 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center space-x-2">
        <span className="font-semibold">Sei</span>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => appWindow.minimize()}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={() => appWindow.toggleMaximize()}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
        >
          <Square className="w-4 h-4" />
        </button>
        <button
          onClick={() => appWindow.close()}
          className="p-1 hover:bg-red-600 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
