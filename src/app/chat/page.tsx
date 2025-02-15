"use client"

import { MarkdownMessage } from "@/components/MarkdownMessage"
import type React from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Copy, Loader2, Send } from "lucide-react"
import { useState, type FormEvent, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/Spinner"

export default function Chat() {
  const [messages, setMessages] = useState<{ id: number; role: string; content: string }[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const lastMessageRef = useRef<string>("")
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState<number | null>(null)
  const latestMessageRef = useRef<HTMLDivElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    if (!latestMessageRef.current || !isLoading) return;
    
    const options: ScrollIntoViewOptions = {
      behavior: "smooth",
      block: "end",
    };

    // Use requestAnimationFrame for smooth scrolling
    const scrollToBottom = () => {
      requestAnimationFrame(() => {
        latestMessageRef.current?.scrollIntoView(options);
      });
    };

    scrollToBottom();
  }, [messages, isLoading]);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    setInput(event.target.value)
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
          prev.map((msg) =>
            msg.id === assistantMessage.id ? { ...msg, content: accumulatedContent } : msg,
          ),
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
    <div className="h-[calc(100vh-2.5rem)] bg-black text-white antialiased">
      <div className="max-w-4xl mx-auto h-full flex flex-col px-4">
        <ScrollArea className="flex-1 py-4 px-6 overflow-y-auto"> {/* Added overflow-y-auto */}
          <div className="space-y-6">
            {error && <div className="text-red-500 text-center p-2 bg-red-950/20 rounded">{error}</div>}
            {messages.map((message, index) => (
              <div
                key={message.id}
                ref={index === messages.length - 1 ? latestMessageRef : null}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-stretch")}
              >
                <div className="flex gap-3 max-w-[80%]">
                  {message.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-cyan-600/20 flex items-center justify-center">
                      <Spinner />
                    </div>
                  )}
                  <div
                    className={cn(
                      "px-4 py-3 rounded-lg text-sm font-arial font-medium leading-relaxed break-words",
                      message.role === "user"
                        ? "bg-transparent border border-neutral-700"
                        : "bg-transparent relative group",
                    )}
                  >
                    <MarkdownMessage 
                      content={message.content} 
                      className={cn(
                        "prose prose-invert max-w-none",
                        message.role === "user" && "prose-p:mb-0"
                      )}
                    />
                    {message.role === "assistant" && message.content && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute -right-12 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(message.content, message.id)}
                      >
                        <Copy className={cn("h-4 w-4", copied === message.id && "text-green-500")} />
                        <span className="sr-only">Copy message</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
              {isLoading || isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

