import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const GlassCard = ({ children, className, glow = false }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-6 shadow-card",
        glow && "glow-primary",
        className
      )}
    >
      {children}
    </div>
  );
};