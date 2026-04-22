import { useEffect, useState, useRef } from "react";

export function useScrollReveal(options = {}) {
  const {
    threshold = 0.15,
    rootMargin = "0px 0px -80px 0px",
    once = true,
  } = options;

  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  // ✅ IMPORTANT: reusable animation state
  const animationClass = isVisible
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-10";

  return { ref, isVisible, animationClass };
}