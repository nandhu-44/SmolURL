"use client";
import { Download } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import type { Link } from "@/lib/types";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";

/** QR code for a short link, with PNG and SVG downloads. Always dark on white so any camera can read it. */
export default function QrDialog({ link, shortUrl, onClose }: { link: Link | null; shortUrl: string; onClose: () => void }) {
  const [png, setPng] = useState("");
  const [svg, setSvg] = useState("");

  useEffect(() => {
    if (!link || !shortUrl) return;
    let live = true;
    const opts = { margin: 2, errorCorrectionLevel: "M" as const, color: { dark: "#111111", light: "#ffffff" } };
    Promise.all([QRCode.toDataURL(shortUrl, { ...opts, width: 1024 }), QRCode.toString(shortUrl, { ...opts, type: "svg" })]).then(([p, s]) => {
      if (live) { setPng(p); setSvg(s); }
    });
    return () => { live = false; };
  }, [link, shortUrl]);

  const file = `smolurl-${link?.slug ?? "link"}`;
  const svgHref = svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : "";

  return (
    <Dialog open={!!link} onOpenChange={(o) => !o && (onClose(), setPng(""), setSvg(""))}>
      <DialogContent
        title="QR code"
        description={`QR code for ${shortUrl}`}
        className="max-w-sm"
        footer={
          <>
            <Button asChild variant="outline" disabled={!svg}><a href={svgHref} download={`${file}.svg`}><Download /> SVG</a></Button>
            <Button asChild disabled={!png}><a href={png} download={`${file}.png`}><Download /> PNG</a></Button>
          </>
        }
      >
        <div className="mx-auto aspect-square w-full max-w-60 overflow-hidden rounded-lg border border-border bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {png ? <img src={png} alt={`QR code that opens ${shortUrl}`} className="size-full" /> : <div className="size-full animate-soft-pulse bg-muted" />}
        </div>
        <p className="mono mt-3 break-all text-center text-sm font-medium">{shortUrl.replace(/^https?:\/\//, "")}</p>
        <p className="mt-1 text-center text-xs text-muted-foreground">Each scan counts as a click.</p>
      </DialogContent>
    </Dialog>
  );
}
