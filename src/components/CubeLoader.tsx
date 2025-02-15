import { cn } from "@/lib/utils"

interface CubeLoaderProps {
  className?: string;
  size?: number;
}

export function CubeLoader({ className, size = 24 }: CubeLoaderProps) {
  const styles = {
    "--cube-size": `${size}px`,
    "--cube-half": `${size/2}px`,
  } as React.CSSProperties;

  return (
    <div className={cn("cube-loader", className)} style={styles}>
      <div className="cube-top"></div>
      <div className="cube-wrapper">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="cube-span" style={{ "--i": i } as React.CSSProperties}></span>
        ))}
      </div>
    </div>
  )
}
