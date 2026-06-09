import { cn } from "@/lib/utils";

interface Props {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function LoadingSpinner({ size = "md", className }: Props) {
  const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };
  return (
    <div className={cn("animate-spin rounded-full border-2 border-purple-200 border-t-purple-600", sizes[size], className)} />
  );
}
