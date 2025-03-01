"use client"

import { useState, useEffect, useRef } from "react"
import { RotateCcw, Settings2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"

type TimerMode = "focus" | "shortBreak" | "longBreak"

const TIMER_MODES = {
  focus: 25,
  shortBreak: 2,
  longBreak: 15,
}

export default function PomodoroTimer() {
  const [time, setTime] = useState(TIMER_MODES.focus * 60)
  const [isActive, setIsActive] = useState(false)
  const [mode, setMode] = useState<TimerMode>("focus")
  const [showOptions, setShowOptions] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout>(undefined)
  const startTimeRef = useRef<number>(undefined)

  // Request notification permission on component mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("Notification permission granted")
        }
      })
    }
  }, [])

  useEffect(() => {
    if (isActive && time > 0) {
      startTimeRef.current = Date.now() - (TIMER_MODES[mode] * 60 - time) * 1000
      intervalRef.current = setInterval(() => {
        const delta = Date.now() - startTimeRef.current!
        const newTime = TIMER_MODES[mode] * 60 - Math.floor(delta / 1000)

        if (newTime <= 0) {
          clearInterval(intervalRef.current)
          setTime(0)
          setIsActive(false)
          // Send notification when timer completes
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`${mode === "focus" ? "Focus" : mode === "shortBreak" ? "Short Break" : "Long Break"} Complete`, {
              body: `Your ${TIMER_MODES[mode]}-minute ${mode} session has ended!`,
              icon: "/path/to/icon.png", // Optional: Add an icon path if available
            })
          }
        } else {
          setTime(newTime)
        }
      }, 100)
    }
    return () => clearInterval(intervalRef.current)
  }, [isActive, mode, time])

  const toggleTimer = () => {
    setIsActive(!isActive)
    setShowOptions(false)
  }

  const resetTimer = () => {
    clearInterval(intervalRef.current)
    setTime(TIMER_MODES[mode] * 60)
    setIsActive(false)
  }

  const changeMode = (newMode: TimerMode) => {
    clearInterval(intervalRef.current)
    setMode(newMode)
    setTime(TIMER_MODES[newMode] * 60)
    setIsActive(false)
    setShowOptions(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  const progress = (time / (TIMER_MODES[mode] * 60)) * 100

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative w-[300px] aspect-square rounded-3xl bg-zinc-900/90 backdrop-blur-lg p-6 flex flex-col items-center justify-between text-white font-modernSans"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-[260px] h-[260px] -rotate-90 transform">
            <circle cx="130" cy="130" r="120" className="stroke-zinc-800" strokeWidth="2" fill="none" />
            <circle
              cx="130"
              cy="130"
              r="120"
              className="stroke-white"
              strokeWidth="2"
              fill="none"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="relative w-full flex justify-between items-center">
          <button onClick={resetTimer} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowOptions((prev) => !prev)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>

        <div className="relative text-center z-10">
          <div className="text-6xl font-bold tracking-tight mb-2 tabular-nums w-[200px] mx-auto">
            {formatTime(time)}
          </div>
          <div className="flex gap-1 justify-center mb-1">
            <div className={cn("w-1 h-1 rounded-full", "bg-white")} />
            <div className={cn("w-1 h-1 rounded-full", "bg-zinc-700")} />
            <div className={cn("w-1 h-1 rounded-full", "bg-zinc-700")} />
            <div className={cn("w-1 h-1 rounded-full", "bg-zinc-700")} />
          </div>
          <div className="text-xs tracking-wider text-zinc-400 uppercase">
            {mode === "focus" ? "Focus" : mode === "shortBreak" ? "Short Break" : "Long Break"}
          </div>
        </div>

        <div className="relative z-10 space-y-3 w-full">
          <button
            onClick={toggleTimer}
            className="w-full py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors uppercase text-sm tracking-wider"
          >
            {isActive ? "Pause" : "Start"}
          </button>

          <AnimatePresence>
            {showOptions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <button
                  onClick={() => changeMode("focus")}
                  className={cn(
                    "w-full py-2 rounded-full transition-colors uppercase text-sm tracking-wider",
                    mode === "focus" ? "bg-white text-black" : "bg-zinc-800 hover:bg-zinc-700",
                  )}
                >
                  Focus
                </button>
                <button
                  onClick={() => changeMode("shortBreak")}
                  className={cn(
                    "w-full py-2 rounded-full transition-colors uppercase text-sm tracking-wider",
                    mode === "shortBreak" ? "bg-white text-black" : "bg-zinc-800 hover:bg-zinc-700",
                  )}
                >
                  Short Break
                </button>
                <button
                  onClick={() => changeMode("longBreak")}
                  className={cn(
                    "w-full py-2 rounded-full transition-colors uppercase text-sm tracking-wider",
                    mode === "longBreak" ? "bg-white text-black" : "bg-zinc-800 hover:bg-zinc-700",
                  )}
                >
                  Long Break
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}