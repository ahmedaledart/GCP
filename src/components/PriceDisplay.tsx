import React, { useEffect, useState, useRef } from 'react';

interface PriceDisplayProps {
  price: number | undefined | null;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ price, className = '' }) => {
  const [flashClass, setFlashClass] = useState('');
  const safePrice = typeof price === 'number' && !isNaN(price) ? price : 0;
  const prevPrice = useRef(safePrice);

  useEffect(() => {
    if (safePrice > prevPrice.current) {
      setFlashClass('flash-up');
    } else if (safePrice < prevPrice.current) {
      setFlashClass('flash-down');
    }
    prevPrice.current = safePrice;

    const timer = setTimeout(() => {
      setFlashClass('');
    }, 1000);

    return () => clearTimeout(timer);
  }, [safePrice]);

  return (
    <span className={`transition-colors duration-300 rounded px-1 ${flashClass} ${className}`}>
      {safePrice.toFixed(2)}
    </span>
  );
};
