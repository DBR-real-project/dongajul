import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface DataItem {
  value: string;
  label: string;
  subtitle?: string;
}

interface FlipCardProps {
  isLoggedIn?: boolean;
  userData?: DataItem[];
  className?: string;
}

const defaultData: DataItem[] = [
  { value: '78.5%', label: '성공률', subtitle: '전략 성공률' },
  { value: '342%', label: '평균 ROI', subtitle: '투자 수익률' },
  { value: '낮음', label: '리스크 지표', subtitle: '위험도 분석' },
  { value: '+127%', label: '누적 수익률', subtitle: '전체 수익' },
];

export function FlipCard({ isLoggedIn = false, userData, className = '' }: FlipCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  const data = isLoggedIn && userData ? userData : defaultData;

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % data.length);
        setIsFlipping(false);
      }, 300);
    }, 3500);

    return () => clearInterval(interval);
  }, [data.length]);

  const currentData = data[currentIndex];

  return (
    <div className={`grid grid-cols-2 gap-6 max-w-md ${className}`}>
      {data.slice(0, 2).map((item, idx) => (
        <motion.div
          key={idx}
          className="relative group cursor-pointer"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
          style={{ perspective: '1000px' }}
        >
          <motion.div
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 relative overflow-hidden"
            style={{
              transformStyle: 'preserve-3d',
            }}
            animate={{
              rotateX: currentIndex === idx && isFlipping ? [0, -90, 0] : 0,
            }}
            transition={{
              duration: 0.6,
              ease: 'easeInOut',
            }}
          >
            {/* Top Half - Fixed */}
            <div className="relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${idx}-${currentIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="text-4xl font-bold text-white mb-2">
                    {item.value}
                  </div>
                  <div className="text-sm text-gray-300">{item.label}</div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Flip Line Effect */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-white/10 z-20"></div>

            {/* Hover Glow */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-400/0 to-purple-400/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15), rgba(168, 85, 247, 0.15))',
              }}
            />
          </motion.div>

          {/* Enhanced Shadow on Hover */}
          <div className="absolute inset-0 bg-gray-1000/0 group-hover:bg-gray-1000/10 blur-xl rounded-xl transition-all duration-300 -z-10"></div>
        </motion.div>
      ))}
    </div>
  );
}

export function FlipCardCycling({ isLoggedIn = false, userData, className = '' }: FlipCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  const data = isLoggedIn && userData ? userData : defaultData;

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % data.length);
        setIsFlipping(false);
      }, 300);
    }, 3500);

    return () => clearInterval(interval);
  }, [data.length]);

  const currentData = data[currentIndex];

  return (
    <motion.div
      className={`relative group cursor-pointer ${className}`}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 relative overflow-hidden min-h-[120px]"
        style={{
          transformStyle: 'preserve-3d',
        }}
        animate={{
          rotateX: isFlipping ? [-90, 0] : 0,
        }}
        transition={{
          duration: 0.6,
          ease: [0.34, 1.56, 0.64, 1],
        }}
      >
        {/* Card Content */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-5xl font-bold text-white mb-2">
                {currentData.value}
              </div>
              <div className="text-base text-gray-300 font-medium">{currentData.label}</div>
              {currentData.subtitle && (
                <div className="text-xs text-[#A9AABC]/70 mt-1">{currentData.subtitle}</div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Flip Line Effect - Airport Board Style */}
        <div className="absolute inset-x-0 top-1/2 h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent z-20"></div>
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/5 z-20 translate-y-1"></div>

        {/* Scanline Effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent pointer-events-none"
          animate={{
            y: ['-100%', '100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />

        {/* Hover Glow */}
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.15), rgba(168, 85, 247, 0.15))',
          }}
        />
      </motion.div>

      {/* Enhanced Shadow on Hover */}
      <div className="absolute inset-0 bg-gray-1000/0 group-hover:bg-gray-1000/20 blur-2xl rounded-xl transition-all duration-300 -z-10"></div>
    </motion.div>
  );
}
