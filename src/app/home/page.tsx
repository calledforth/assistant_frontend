"use client"

import { useState, useEffect } from "react"
import Chat from "@/components/Chat"
import { History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HistoryDialog } from "@/components/HistoryDialog"

export default function HomePage() {
  const [historyOpen, setHistoryOpen] = useState(false)

  // Handle keyboard shortcut for history (Ctrl+H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "h") {
        e.preventDefault()
        setHistoryOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <main className="fixed inset-0 flex justify-center items-center bg-black">
      {/* Chat Section - centered and contained */}
      <div className="flex items-center justify-center pt-5">
        <Chat />
      </div>

      {/* Top-right History Button */}
      <div className="absolute top-8 right-7 z-20">
        <Button
          onClick={() => setHistoryOpen(true)}
          size="icon"
          variant="outline"
          className="rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors backdrop-blur-sm border border-white/10"
          title="Chat History (Ctrl+H)"
        >
          <History className="h-4 w-4" />
        </Button>
      </div>

      {/* History Dialog */}
      <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />
    </main>
  )
}

