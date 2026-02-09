import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "primary"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "info"
  | "destructive";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary/40 text-foreground border-foreground/20",
  secondary: "bg-secondary/40 text-foreground border-foreground/20",
  outline: "bg-transparent text-foreground border-foreground/20",
  success: "bg-success/40 text-foreground border-foreground/20",
  warning: "bg-warning/40 text-foreground border-foreground/20",
  info: "bg-info/40 text-foreground border-foreground/20",
  destructive: "bg-destructive/40 text-foreground border-foreground/20",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-2 px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
