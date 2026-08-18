import { useState, useEffect, useCallback } from 'react';

const slides = [
  {
    src: '/images/hero/team-collaboration.jpg',
    alt: 'Team collaborating on project',
    label: 'Expert Teams',
  },
  {
    src: '/images/hero/developer-coding.jpg',
    alt: 'Developer writing code',
    label: 'Modern Development',
  },
  {
    src: '/images/hero/online-learning.jpg',
    alt: 'Online learning session',
    label: 'Learn Anywhere',
  },
  {
    src: '/images/hero/data-dashboard.jpg',
    alt: 'Data analytics dashboard',
    label: 'Data-Driven Results',
  },
  {
    src: '/images/hero/modern-workspace.jpg',
    alt: 'Modern tech workspace',
    label: 'World-Class Tools',
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, isHovered]);

  return (
    <div
      className="relative w-full h-full min-h-[400px] md:min-h-[500px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Images */}
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            i === current
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-105'
          }`}
        >
          {/* Hero imagery is above the fold — always load eagerly. */}
          <img
            src={slide.src}
            alt={slide.alt}
            className="w-full h-full object-cover rounded-2xl"
          />
          {/* Gradient overlay. These are bright stock photos sitting on a
              near-black page, so the wash is heavier than a normal scrim —
              it's carrying the image down toward the surrounding surface. */}
          <div className="absolute inset-0 rounded-2xl bg-linear-to-t from-black/70 via-black/25 to-black/10" />
        </div>
      ))}

      {/* Dots, centred beneath the frame rather than floating over the
          image, per the design. */}
      <div className="absolute -bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-600 hover:bg-slate-500'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
