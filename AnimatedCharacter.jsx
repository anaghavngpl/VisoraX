import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AnimatedCharacter = () => {
  const [isWaving, setIsWaving] = useState(false);

  const characters = ['🤖', '🚗', '👁️', '⚡', '🛡️'];
  const [currentChar, setCurrentChar] = useState(0);

  const handleClick = () => {
    setIsWaving(true);
    setCurrentChar((prev) => (prev + 1) % characters.length);
    setTimeout(() => setIsWaving(false), 1000);
  };

  return (
    <motion.div
      className="floating-character"
      onClick={handleClick}
      animate={{
        y: [0, -15, 0],
        rotate: isWaving ? [0, 15, -15, 15, -15, 0] : 0,
      }}
      transition={{
        y: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        },
        rotate: {
          duration: 0.5,
          ease: "easeInOut"
        }
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        key={currentChar}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {characters[currentChar]}
      </motion.span>
    </motion.div>
  );
};

export default AnimatedCharacter;
