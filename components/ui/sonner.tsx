"use client";

import * as React from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border group-[.toaster]:border-white/10 group-[.toaster]:bg-card/95 group-[.toaster]:text-foreground group-[.toaster]:shadow-glass",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
