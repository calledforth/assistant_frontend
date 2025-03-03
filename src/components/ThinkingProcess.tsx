import { useState } from "react" 
import { Brain, ChevronDown, ChevronUp } from "lucide-react" 
import { Button } from "@/components/ui/button" 
import { MarkdownMessage } from "@/components/MarkdownMessage" 
import { cn } from "@/lib/utils"

interface ThinkingProcessProps { 
    content: string; 
    isVisible?: boolean; 
    onToggleVisibility?: () => void; 
}

export function ThinkingProcess({ content, isVisible = true, onToggleVisibility }: ThinkingProcessProps) { 
    const [localIsVisible, setLocalIsVisible] = useState(true);

    // Use external control if provided, otherwise use local state 
    const visible = onToggleVisibility ? isVisible : localIsVisible;

const handleToggle = () => { if (onToggleVisibility) { onToggleVisibility() } else { setLocalIsVisible(prev => !prev) } }

return ( 
<div className="mb-3 bg-black backdrop-blur-sm rounded-lg p-4 border border-white/10 shadow-inner"> <div className="flex items-center justify-between mb-2"> <div className="flex items-center gap-2 text-xs font-medium text-white/60"> <Brain className="h-4 w-4" /> <span>Thinking process</span> </div> <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full hover:bg-white/10" onClick={handleToggle} > {visible ? ( <ChevronUp className="h-4 w-4 text-white/60" /> ) : ( <ChevronDown className="h-4 w-4 text-white/60" /> )} </Button> </div>

  {visible && (
    <div className="text-white/80 text-xs leading-relaxed transition-all">
      <MarkdownMessage
        content={content}
        className="prose prose-invert prose-sm max-w-none prose-pre:bg-black/30 prose-pre:text-xs"
      />
    </div>
  )}
</div>
) }