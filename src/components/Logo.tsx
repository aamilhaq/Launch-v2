import logoAsset from "@/assets/launch-logo.png.asset.json";

export const Logo = ({ className = "h-8", variant = "dark" }: { className?: string; variant?: "dark" | "light" }) => (
  <div className={`inline-flex items-center gap-2 ${variant === "light" ? "" : "bg-sidebar rounded-lg px-3 py-1.5"}`}>
    <img src={logoAsset.url} alt="Launch logo" className={className} />
  </div>
);
