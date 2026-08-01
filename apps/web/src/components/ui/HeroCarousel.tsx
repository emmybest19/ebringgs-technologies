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
          <img loading="lazy"
            src={slide.src}
            alt={slide.alt}
            className="w-full h-full object-cover rounded-2xl"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 rounded-2xl bg-linear-to-t from-black/60 via-black/10 to-transparent" />

          {/* Label */}
          <div
            className={`absolute bottom-6 left-6 transition-all duration-500 delay-200 ${
              i === current
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-sm font-medium">
              {slide.label}
            </span>
          </div>
        </div>
      ))}

      {/* Dots */}
      <div className="absolute bottom-6 right-6 flex gap-2 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === current
                ? 'bg-white w-8'
                : 'bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Decorative border glow */}
      <div className="absolute -inset-1 rounded-3xl bg-linear-to-br from-teal-400/20 via-transparent to-cyan-400/20 -z-10 blur-sm" />
    </div>
  );
}
