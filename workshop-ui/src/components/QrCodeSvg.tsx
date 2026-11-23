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
      margin: 1,
      color: {
        dark: "#0B0F0A",
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
  }, [value]);

  if (!svgMarkup) {
    return (
      <div
        className={`flex max-w-full items-center justify-center rounded-xl border bg-white text-xs text-neutral-500 ${className}`}
        style={{ width: size, height: size }}
      >
        QR lädt…
      </div>
    );
  }

  return (
    <div
      className={`aspect-square max-w-full rounded-2xl bg-white p-2.5 shadow-sm [&_svg]:block [&_svg]:h-full [&_svg]:w-full ${className}`}
      style={{ width: size }}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
      aria-label={`QR-Code für ${value}`}
    />
  );
}
