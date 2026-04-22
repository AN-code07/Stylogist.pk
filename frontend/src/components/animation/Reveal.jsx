import React from "react";
import { useScrollReveal } from "../../hooks/useScrollReveal";

export default function Reveal({
  children,
  className = "",
  delay = 0,
  as: Component = "div",
}) {
  const { ref, isVisible } = useScrollReveal();

  return (
    <Component
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out will-change-transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } ${className}`}
    >
      {children}
    </Component>
  );
}