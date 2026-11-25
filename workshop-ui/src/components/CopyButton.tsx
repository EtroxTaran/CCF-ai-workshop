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
    let ok = false;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch {
        ok = false;
      }
    }

    if (!ok && typeof document !== "undefined") {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.readOnly = true;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "-9999px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, 99999);
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      } finally {
        document.body.removeChild(ta);
      }
    }

    if (!ok) {
      toast.error("Kopieren fehlgeschlagen — bitte Text manuell markieren und kopieren.");
      return;
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
