import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  hover?: boolean;
}

export function GlassCard({
  className,
  glow,
  hover = true,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-5",
        hover && "transition-all duration-300 hover:bg-white/[0.08] hover:border-white/12",
        glow && "shadow-[0_0_40px_rgba(7,102,83,0.15)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
