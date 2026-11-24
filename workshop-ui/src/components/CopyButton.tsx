import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";

interface CopyButtonProps extends Omit<ButtonProps, "onClick"> {
  text: string;
  label?: string;
  copiedLabel?: string;
  toastMessage?: string;
  onCopy?: () => void;
}

export function CopyButton({
  text,
  label = "Kopieren",
  copiedLabel = "Kopiert",
  toastMessage,
  onCopy,
  variant = "outline",
  size = "sm",
  ...rest
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    onCopy?.();
    const cleaned = label.replace(/\s*kopieren$/i, "").trim();
    toast.success(
      toastMessage || (cleaned ? `${cleaned} in Zwischenablage kopiert` : "In Zwischenablage kopiert")
    );
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={handleCopy} {...rest}>
      {copied ? <Check className="h-3.5 w-3.5 text-current" /> : <Copy className="h-3.5 w-3.5" />}
      <span>{copied ? copiedLabel : label}</span>
    </Button>
  );
}
