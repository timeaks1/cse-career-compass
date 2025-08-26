import { useState } from "react";

interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const HeroImage = ({ src, alt, className = "" }: HeroImageProps) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-700 ${
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
        }`}
        onLoad={() => setLoaded(true)}
      />
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
    </div>
  );
};