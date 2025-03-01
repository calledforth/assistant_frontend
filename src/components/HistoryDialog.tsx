"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"

interface HistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HistoryDialog({ open, onOpenChange }: HistoryDialogProps) {
  const [history, setHistory] = useState<{ date: string; conversations: { title: string; id: string }[] }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open) {
      // Mock data - replace with actual API call to fetch history
      setLoading(true)
      setTimeout(() => {
        setHistory([
          {
            date: "Today",
            conversations: [
              { title: "How to implement a sorting algorithm", id: "conv1" },
              { title: "NextJS page router vs app router", id: "conv2" },
            ]
          },
          {
            date: "Yesterday",
            conversations: [
              { title: "React state management options", id: "conv3" },
              { title: "Building a responsive layout", id: "conv4" },
            ]
          }
        ])
        setLoading(false)
      }, 500)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-black/80 backdrop-blur-md text-white border border-white/10 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Chat History</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <ScrollArea className="h-[70vh] pr-4">
            {loading ? (
              <div className="flex items-center justify-center h-20">
                <div className="animate-spin h-6 w-6 border-t-2 border-white rounded-full" />
              </div>
            ) : (
              <div className="space-y-6">
                {history.map((group) => (
                  <div key={group.date} className="space-y-2">
                    <h3 className="text-sm font-medium text-white/60">{group.date}</h3>
                    <div className="space-y-2">
                      {group.conversations.map((convo) => (
                        <div 
                          key={convo.id}
                          className="p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer backdrop-blur-sm border border-white/10 shadow-sm"
                          onClick={() => {
                            // Handle loading the conversation
                            console.log("Loading conversation:", convo.id)
                            onOpenChange(false)
                          }}
                        >
                          <p className="text-sm font-medium">{convo.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
