import Image from "next/image";

type GinLogoProps = {
  variant?: "default" | "light";
  width?: number;
  height?: number;
  className?: string;
};

export function GinLogo({ variant = "default", width = 280, height = 63, className }: GinLogoProps) {
  return (
    <Image
      src={variant === "light" ? "/gin/gin-logo-light.svg" : "/gin/gin-logo.svg"}
      alt="GIN — Global Information Network"
      width={width}
      height={height}
      className={className}
      priority={width >= 280}
    />
  );
}

export function GinMark({ size = 42 }: { size?: number }) {
  return <Image src="/gin/gin-mark.svg" alt="GIN" width={size} height={size} />;
}
