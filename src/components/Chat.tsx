"use client"

import { MarkdownMessage } from "@/components/MarkdownMessage"
import type React from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Copy, Loader2, Send, ArrowDown, Brain } from "lucide-react"
import { useState, type FormEvent, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

// Enhanced processing of streamed content to handle <think> tags in real-time
function processStreamedContent(content: string): { thinking: string | null; response: string; isThinkingComplete: boolean } {
  const openTagIndex = content.indexOf("<think>");
  const closeTagIndex = content.indexOf("</think>");
  
  // If we have an opening tag but no closing tag yet (thinking in progress)
  if (openTagIndex !== -1 && closeTagIndex === -1) {
    const thinkingContent = content.substring(openTagIndex + 7); // +7 to skip "<think>"
    const responseSoFar = content.substring(0, openTagIndex); // Everything before <think>
    return { 
      thinking: thinkingContent, 
      response: responseSoFar, 
      isThinkingComplete: false 
    };
  }
  
  // If thinking is complete (has both tags)
  if (openTagIndex !== -1 && closeTagIndex !== -1) {
    const thinkingContent = content.substring(openTagIndex + 7, closeTagIndex);
    // Response is everything before and after the thinking tags, excluding the tags and their content
    const responseBefore = content.substring(0, openTagIndex);
    const responseAfter = content.substring(closeTagIndex + 8); // +8 to skip "</think>"
    return { 
      thinking: thinkingContent, 
      response: responseBefore + responseAfter, 
      isThinkingComplete: true 
    };
  }
  
  // No thinking tags found
  return { 
    thinking: null, 
    response: content, 
    isThinkingComplete: false 
  };
}

export default function Chat() {
  const [messages, setMessages] = useState<{ id: number; role: string; content: string; thinking?: string | null; isThinkingComplete?: boolean }[]>([])
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
    if (!latestMessageRef.current) return

    const options: ScrollIntoViewOptions = {
      behavior: "smooth",
      block: "end",
    }

    const scrollToBottom = () => {
      requestAnimationFrame(() => {
        latestMessageRef.current?.scrollIntoView(options)
      })
    }

    // Scroll when streaming or loading changes
    if (isStreaming || isLoading) {
      scrollToBottom()
    }
  }, [isLoading, isStreaming, messages])

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
              
              // Process the accumulated content to extract thinking and response
              const { thinking, response, isThinkingComplete } = processStreamedContent(accumulatedContent);
              
              // Update messages with processed content
              lastMessageRef.current = accumulatedContent
              setMessages((prev) =>
                prev.map((msg) => 
                  msg.id === assistantMessage.id 
                    ? { 
                        ...msg, 
                        content: accumulatedContent, // Keep raw content for reference
                        thinking: thinking, 
                        response: response, // Store processed response separately
                        isThinkingComplete: isThinkingComplete
                      } 
                    : msg
                )
              )
            }
            if (jsonData.error) {
              setError(jsonData.error)
              break
            }
          } catch (parseError) {
            console.error("Error parsing JSON:", parseError)
          }
        }
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

  const renderMessageContent = (message: { role: string; content: string; thinking?: string | null; response?: string; isThinkingComplete?: boolean }) => {
    if (message.role === "user") {
      return (
        <MarkdownMessage
          content={message.content}
          className="prose prose-invert max-w-none prose-p:mb-0"
        />
      );
    }
    
    // Use the pre-processed thinking and response values directly
    const displayThinking = message.thinking || null;
    const displayResponse = message.response || '';

    return (
      <>
        {displayThinking && (
          <div className="mb-3 bg-black backdrop-blur-sm rounded-lg p-4 border border-white/10 shadow-inner">
            <div className="flex items-center gap-2 mb-2 text-xs font-medium text-white/60">
              <Brain className="h-4 w-4" /> 
              <span>Thinking process</span>
            </div>
            <div className="text-white/80 text-xs leading-relaxed">
              <MarkdownMessage
                content={displayThinking}
                className="prose prose-invert prose-sm max-w-none prose-pre:bg-black/30 prose-pre:text-xs"
              />
            </div>
          </div>
        )}
        {displayResponse && (
          <MarkdownMessage
            content={displayResponse}
            className="prose prose-invert max-w-none"
          />
        )}
      </>
    );
  };

  return (
    <div className="h-[calc(100vh-2.5rem)] w-[1000px] text-white antialiased rounded-xl shadow-lg border border-white/10 bg-black backdrop-blur-md flex flex-col">
      <ScrollArea className="flex-1 py-4 overflow-y-auto" ref={scrollAreaRef}>
        <div className="space-y-6 px-6">
          {error && <div className="text-red-500 text-center p-2 bg-red-950/20 rounded">{error}</div>}
          {messages.map((message, index) => (
            <div
              key={message.id}
              ref={index === messages.length - 1 ? latestMessageRef : null}
              className="w-full"
            >
              {message.role === "user" ? (
                <div className="flex justify-end w-full">
                  <div 
                    className="px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed break-words max-w-[70%] bg-neutral-500/15 backdrop-blur-sm text-white"
                  >
                    {renderMessageContent(message)}
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  <div 
                    className="px-4 py-3 rounded-lg text-sm font-medium leading-relaxed break-words w-full border border-white/5 bg-blue-950/25 backdrop-blur-sm"
                  >
                    {renderMessageContent(message)}
                  </div>
                  
                  {message.content && (
                    <div className="mt-2 flex justify-start">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100 transition-colors"
                        onClick={() => copyToClipboard(message.content, message.id)}
                      >
                        <Copy className={cn("h-4 w-4 mr-2", copied === message.id && "text-green-500")} />
                        {copied === message.id ? "Copied!" : ""}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {showScrollButton && (
          <Button
            size="icon"
            variant="outline"
            className="fixed bottom-20 right-8 rounded-full bg-white/10 text-zinc-100 hover:bg-white/20 backdrop-blur-sm border border-white/10"
            onClick={scrollToBottom}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </ScrollArea>

      <form onSubmit={handleSubmit} className="py-4 px-6 flex gap-2 relative border-t border-white/10">
        <div className="relative flex-1 group">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Message..."
            className="text-sm font-workSans h-10 px-4 rounded-full bg-white/5 border border-white/10 focus-visible:ring-1 focus-visible:ring-neutral-700 shadow-[0_0_1px_1px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_1px_1px_rgba(255,255,255,0.1)] transition-shadow backdrop-blur-sm"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || isStreaming}
            className="absolute right-1 top-1 h-8 w-8 rounded-full border-white/10 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
          >
            {isLoading || isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </form>
    </div>
  );
}