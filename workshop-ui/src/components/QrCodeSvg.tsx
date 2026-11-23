import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrCodeSvg({ value, size = 148, className = "" }: QrCodeSvgProps) {
  const [svgMarkup, setSvgMarkup] = useState<string>("");

  useEffect(() => {
    let active = true;
    if (!value) return;
    QRCode.toString(value, {
      type: "svg",
      width: size,
      margin: 1,
      color: {
        dark: "#262625",
        light: "#FFFFFF",
      },
    })
      .then((svg) => {
        if (active) setSvgMarkup(svg);
      })
      .catch(() => {
        if (active) setSvgMarkup("");
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  if (!svgMarkup) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border bg-white text-xs text-muted-foreground ${className}`}
        style={{ width: size, height: size }}
      >
        QR wird geladen...
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-white p-1.5 shadow-sm ${className}`}
      style={{ width: size + 12, height: size + 12 }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
      aria-label={`QR-Code für ${value}`}
    />
  );
}
