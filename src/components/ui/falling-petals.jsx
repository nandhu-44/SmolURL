"use client";
import { useEffect, useState } from 'react';

const petalVariants = [
  // Cherry blossom petal
  `M15 3.5C19.5 3.5 22.5 6.5 22.5 8.5C22.5 15 16.5 26.5 15 26.5C13.5 26.5 7.5 15 7.5 8.5C7.5 6.5 10.5 3.5 15 3.5Z`,
  // Rose petal
  `M15 3C18.5 3.5 22 6 22.5 9.5C23 13 21.5 16.5 19 20C16.5 23.5 15 27 15 27C15 27 13.5 23.5 11 20C8.5 16.5 7 13 7.5 9.5C8 6 11.5 3.5 15 3Z`,
  // Rounded petal
  `M15 3C17.5 3 22 5.5 22 12C22 18.5 17.5 27 15 27C12.5 27 8 18.5 8 12C8 5.5 12.5 3 15 3Z`
];

const Petal = ({ delay }) => {
  const variant = petalVariants[Math.floor(Math.random() * petalVariants.length)];
  const scale = Math.random() * 0.3 + 0.8; // Scale between 0.8 and 1.1
  
  return (
    <div
      className="absolute animate-falling"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${delay}s`,
        opacity: Math.random() * 0.3 + 0.5, // Opacity between 0.5 and 0.8
      }}
    >
      <svg
        width="35"
        height="35"
        viewBox="0 0 30 30"
        fill="none"
        className="animate-sway"
        style={{
          transform: `scale(${scale})`,
        }}
      >
        <path
          d={variant}
          className="fill-rose-300 dark:fill-rose-400"
          style={{
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))'
          }}
        />
      </svg>
    </div>
  );
};

export function FallingPetals({ count = 8, subtle = false }) {
  const [petals, setPetals] = useState([]);

  useEffect(() => {
    // Initial petals with staggered delays
    const initialPetals = Array.from({ length: Math.min(count, 12) }, (_, i) => ({
      id: i,
      delay: i * (15 / count) // Spread initial delays more
    }));
    setPetals(initialPetals);

    // Add new petals periodically
    const interval = setInterval(() => {
      setPetals(current => {
        const newPetal = {
          id: Date.now(),
          delay: 0
        };
        return [...current.slice(-(count - 1)), newPetal];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [count]);

  return (
    <div className={`fixed inset-0 pointer-events-none ${subtle ? 'opacity-40' : 'opacity-70'}`}>
      {petals.map(petal => (
        <Petal key={petal.id} delay={petal.delay} />
      ))}
    </div>
  );
}
