import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/shared/lib/utils"
import { Eye, EyeOff } from "lucide-react";

interface InputProps extends React.ComponentProps<"input"> {
  isPasswordVisible?: boolean;
  onToggleVisibility?: () => void;
}

export function Input({ className, type, isPasswordVisible, onToggleVisibility, ...props }: InputProps) {
  const isPassword = type === "password";
  return (
    <div className="relative w-full">
      <InputPrimitive
        type={isPassword && isPasswordVisible ? "text" : type}
        data-slot="input"
        className={cn(
          "pr-10", 
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none",
          className
        )}
        {...props}
      />

      {isPassword && onToggleVisibility && (
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {isPasswordVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  )
}


