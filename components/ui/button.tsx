import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "default" | "sm" | "lg" | "icon";

const baseClasses =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 shadow-[0_4px_0_0_rgba(61,44,44,0.12)] active:shadow-[0_2px_0_0_rgba(61,44,44,0.12)]";

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-primary text-foreground border-2 border-foreground/20 hover:brightness-[0.98]",
  secondary: "bg-secondary text-foreground border-2 border-foreground/20 hover:brightness-[0.98]",
  outline: "bg-transparent border-2 border-foreground/20 text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted shadow-none",
  destructive: "bg-destructive text-destructive-foreground border-2 border-foreground/20 hover:brightness-[0.98]",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3 text-xs",
  lg: "h-11 px-6",
  icon: "h-9 w-9 p-0",
};

export function buttonClasses({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(baseClasses, variantClasses[variant], sizeClasses[size], className);
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  )
);

Button.displayName = "Button";
