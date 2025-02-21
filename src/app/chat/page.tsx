"use client"

import { MarkdownMessage } from "@/components/MarkdownMessage"
import type React from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Copy, Loader2, Send, ArrowDown } from "lucide-react"
import { useState, type FormEvent, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { CubeLoader } from "@/components/CubeLoader"

export default function Chat() {
  const [messages, setMessages] = useState<{ id: number; role: string; content: string }[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const lastMessageRef = useRef<string>("")
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<number | null>(null)
  const latestMessageRef = useRef<HTMLDivElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!latestMessageRef.current || !isLoading) return

    const options: ScrollIntoViewOptions = {
      behavior: "smooth",
      block: "end",
    }

    // Use requestAnimationFrame for smooth scrolling
    const scrollToBottom = () => {
      requestAnimationFrame(() => {
        latestMessageRef.current?.scrollIntoView(options)
      })
    }

    scrollToBottom()
  }, [isLoading])

  useEffect(() => {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollArea
      setShowScrollButton(scrollHeight - scrollTop > clientHeight + 100)
    }

    scrollArea.addEventListener("scroll", handleScroll)
    return () => scrollArea.removeEventListener("scroll", handleScroll)
  }, [])

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setInput(event.target.value)
  }

  const scrollToBottom = () => {
    if (latestMessageRef.current) {
      latestMessageRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  const copyToClipboard = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    if (input.trim() === "" || isLoading) return

    setError(null)
    setIsStreaming(true)

    const userMessage = {
      id: messages.length + 1,
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    const assistantMessage = {
      id: messages.length + 2,
      role: "assistant",
      content: "",
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          message: input,
          username: "cle",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No reader available")
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          setIsStreaming(false)
          break
        }

        const text = new TextDecoder().decode(value)
        const lines = text.split("\n")
        let accumulatedContent = lastMessageRef.current

        for (const line of lines) {
          if (line.trim() === "") continue

          try {
            const jsonData = JSON.parse(line)
            if (jsonData.message) {
              accumulatedContent += jsonData.message
            }
            if (jsonData.error) {
              setError(jsonData.error)
              break
            }
          } catch (parseError) {
            console.error("Error parsing JSON:", parseError)
          }
        }

        // Update state only once per chunk
        lastMessageRef.current = accumulatedContent
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMessage.id ? { ...msg, content: accumulatedContent } : msg)),
        )
      }
    } catch (error) {
      console.error("Error:", error)
      setError(
        error instanceof Error
          ? error.message
          : "Failed to connect to AI service. Please check if the backend is running.",
      )
      setMessages((prev) => prev.slice(0, -1))
      setIsStreaming(false)
    } finally {
      setIsLoading(false)
      lastMessageRef.current = ""
    }
  }

  return (
    <div className="h-[calc(100vh-2.5rem)] bg-zinc-900 text-white antialiased">
      <div className="max-w-4xl mx-auto h-full flex flex-col px-4">
        <ScrollArea className="flex-1 py-4 overflow-y-auto" ref={scrollAreaRef}>
          {" "}
          {/* Removed px-6 from ScrollArea */}
          <div className="space-y-6 px-6">
            {" "}
            {/* Added px-6 to inner container */}
            {error && <div className="text-red-500 text-center p-2 bg-red-950/20 rounded">{error}</div>}
            {messages.map((message, index) => (
              <div
                key={message.id}
                ref={index === messages.length - 1 ? latestMessageRef : null}
                className={cn("flex", message.role === "user" ? "justify-end" : "w-full")}
              >
                <div className="flex gap-3 items-start">
                  {message.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-cyan-600/20 flex items-center justify-center mt-1 flex-shrink-0">
                      <CubeLoader size={14} className="opacity-100" />
                    </div>
                  )}
                  <div className="flex-grow">
                    <div
                      className={cn(
                        "px-4 py-3 rounded-lg text-sm font-arial font-medium leading-relaxed break-words",
                        message.role === "user" ? "bg-zinc-800" : "bg-transparent",
                      )}
                    >
                      <MarkdownMessage
                        content={message.content}
                        className={cn("prose prose-invert max-w-none", message.role === "user" && "prose-p:mb-0")}
                      />
                    </div>
                    {message.role === "assistant" && message.content && (
                      <div className="mt-2 flex justify-start">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                          onClick={() => copyToClipboard(message.content, message.id)}
                        >
                          <Copy className={cn("h-4 w-4 mr-2", copied === message.id && "text-green-500")} />
                          {copied === message.id ? "Copied!" : "Copy"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {showScrollButton && (
            <Button
              size="icon"
              variant="outline"
              className="fixed bottom-20 right-8 rounded-full bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              onClick={scrollToBottom}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          )}
        </ScrollArea>

        <form onSubmit={handleSubmit} className="py-4 flex gap-2 relative">
          <div className="relative flex-1 group">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Message..."
              className="text-sm font-workSans h-10 px-4 rounded-full bg-neutral-800/50 border-0 focus-visible:ring-1 focus-visible:ring-cyan-600 shadow-[0_0_1px_1px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_1px_1px_rgba(255,255,255,0.2)] transition-shadow"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || isStreaming}
              className="absolute right-1 top-1 h-8 w-8 rounded-full bg-transparent hover:bg-neutral-700/50"
            >
              {isLoading || isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

