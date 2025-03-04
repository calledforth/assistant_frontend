import { useState, useEffect } from "react" 
import { Brain, ChevronDown, ChevronUp } from "lucide-react" 
import { Button } from "@/components/ui/button" 
import { MarkdownMessage } from "@/components/MarkdownMessage" 
import { cn } from "@/lib/utils"

interface ThinkingProcessProps { 
    content: string; 
    isVisible?: boolean;
    isThinkingComplete?: boolean;
    onToggleVisibility?: () => void; 
}

export function ThinkingProcess({ 
  content, 
  isVisible, 
  isThinkingComplete = false,
  onToggleVisibility 
}: ThinkingProcessProps) { 
  // Local visibility state - default to visible when thinking, hidden when complete
  const [localIsVisible, setLocalIsVisible] = useState(!isThinkingComplete);

  // When thinking completes, update local visibility
  useEffect(() => {
    if (isThinkingComplete) {
      if (!onToggleVisibility) {
        setLocalIsVisible(false);
      }
    }
  }, [isThinkingComplete, onToggleVisibility]);

  // Use external control if provided, otherwise use local state 
  const visible = onToggleVisibility !== undefined ? isVisible : localIsVisible;

  const handleToggle = () => { 
    if (onToggleVisibility) { 
      onToggleVisibility() 
    } else { 
      setLocalIsVisible(prev => !prev) 
    } 
  }

  return ( 
    <div className="rounded-lg p-4 bordershadow-inner"> 
      <div className="flex items-center gap-2 mb-2"> 
        <div className="flex items-center gap-2 text-xs font-medium text-white/60"> 
          <Brain className="h-4 w-4" /> 
          <span>Thinking process</span> 
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-5 w-5 p-0 rounded-full hover:bg-white/10 ml-1 transition-all duration-200" 
          onClick={handleToggle} 
        > 
          {visible ? ( 
            <ChevronUp className="h-3.5 w-3.5 text-white/60 transition-transform duration-200" /> 
          ) : ( 
            <ChevronDown className="h-3.5 w-3.5 text-white/60 transition-transform duration-200" /> 
          )} 
        </Button>

      </div>

      <div 
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          visible ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className={cn(
          "font-workSans text-xs leading-relaxed pt-1",
          isThinkingComplete 
            ? "bg-clip-text text-transparent" 
            : "text-white/40"
        )}>
          <MarkdownMessage
            content={content}
            className="prose prose-invert prose-sm max-w-none prose-pre:bg-black/30 prose-pre:text-xs text-white/50"
          />
        </div>
      </div>
    </div>
  )
}