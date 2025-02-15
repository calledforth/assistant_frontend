"use client"

import { getCurrentWindow, Window } from "@tauri-apps/api/window"
import { Minus, Square, X } from "lucide-react"
import { useEffect, useState } from "react"

export function TitleBar() {
    const appWindow = getCurrentWindow()

  return (
    <div data-tauri-drag-region className="flex items-center justify-between bg-black text-white h-10 px-4 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center space-x-2">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="font-semibold">Productivity</span>
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
