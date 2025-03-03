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
  // Local visibility state with default value depending on thinking completion status
  const [localIsVisible, setLocalIsVisible] = useState(!isThinkingComplete);

  // If thinking completes, update local visibility if we're using it
  useEffect(() => {
    if (isThinkingComplete && !onToggleVisibility) {
      setLocalIsVisible(false);
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
    <div className="mb-3 bg-black backdrop-blur-md rounded-lg p-4 border border-white/5 shadow-inner"> 
      <div className="flex items-center gap-2 mb-2"> 
        <div className="flex items-center gap-2 text-xs font-medium text-white/60"> 
          <Brain className="h-4 w-4" /> 
          <span>Thinking process</span> 
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-5 w-5 p-0 rounded-full hover:bg-white/10 ml-1" 
          onClick={handleToggle} 
        > 
          {visible ? ( 
            <ChevronUp className="h-3.5 w-3.5 text-white/60" /> 
          ) : ( 
            <ChevronDown className="h-3.5 w-3.5 text-white/60" /> 
          )} 
        </Button>
        
        {isThinkingComplete && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/40 ml-auto">
            Complete
          </span>
        )}
      </div>

      {visible && (
        <div className="text-base leading-relaxed transition-all overflow-hidden">
          <div className={cn(
            "font-modernSans",
            isThinkingComplete 
              ? "bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50" 
              : "text-white/80"
          )}>
            <MarkdownMessage
              content={content}
              className="prose prose-invert prose-sm max-w-none prose-pre:bg-black/30 prose-pre:text-xs"
            />
          </div>
        </div>
      )}
    </div>
  )
}