import React, { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

export const AnimatedCounter = ({
  value,
  duration = 1.0,
  prefix = '',
  suffix = '',
}) => {
  const nodeRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    if (prefersReducedMotion) {
      node.textContent = `${prefix}${Math.round(value).toLocaleString()}${suffix}`;
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate(v) {
        node.textContent = `${prefix}${Math.round(v).toLocaleString()}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [value, duration, prefix, suffix, prefersReducedMotion]);

  return <span ref={nodeRef} />;
};

export default AnimatedCounter;
