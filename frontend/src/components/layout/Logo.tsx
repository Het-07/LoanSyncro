import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  textColor?: string;
}

export default function Logo({
  size = "md",
  textColor = "text-white",
}: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-lg",
    md: "h-10 w-10 text-xl",
    lg: "h-12 w-12 text-2xl",
  };

  return (
    <div className="flex items-center">
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-md border-2 border-primary-300`}
      >
        <span className="font-bold">LS</span>
      </div>
      <div className={`ml-2 ${textColor}`}>
        <span className="font-bold tracking-tight">
          Loan<span className="text-accent-400">Syncro</span>
        </span>
      </div>
    </div>
  );
}
