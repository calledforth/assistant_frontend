import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'

interface MarkdownMessageProps {
  content: string
  className?: string
}

// Add this type to properly type the code component props
type CodeProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
  inline?: boolean
  node?: any
}

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  return (
    <ReactMarkdown
      className={className}
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
      components={{
        pre: ({ node, children, ...props }) => (
          <pre className="bg-neutral-900 p-4 rounded-lg overflow-auto my-2" {...props}>
            {children}
          </pre>
        ),
        code: ({ node, inline, children, ...props }: CodeProps) => (
          inline ? 
            <code className="bg-neutral-900 px-1 py-0.5 rounded" {...props}>{children}</code> :
            <code {...props}>{children}</code>
        ),
        p: ({ children }) => (
          <p className="mb-4 last:mb-0">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-4">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-4">{children}</ol>
        ),
        a: ({ children, href }) => (
          <a href={href} className="text-cyan-500 hover:underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

