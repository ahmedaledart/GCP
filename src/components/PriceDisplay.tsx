import React, { useEffect, useState, useRef } from 'react';

interface PriceDisplayProps {
  price: number;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ price, className = '' }) => {
  const [flashClass, setFlashClass] = useState('');
  const prevPrice = useRef(price);

  useEffect(() => {
    if (price > prevPrice.current) {
      setFlashClass('flash-up');
    } else if (price < prevPrice.current) {
      setFlashClass('flash-down');
    }
    prevPrice.current = price;

    const timer = setTimeout(() => {
      setFlashClass('');
    }, 1000);

    return () => clearTimeout(timer);
  }, [price]);

  return (
    <span className={`transition-colors duration-300 rounded px-1 ${flashClass} ${className}`}>
      {price.toFixed(2)}
    </span>
  );
};
