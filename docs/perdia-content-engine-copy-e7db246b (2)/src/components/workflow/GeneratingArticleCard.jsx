import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';

const TypingEffect = ({ messages, currentStepMessage, interval = 2000, delayPerChar = 50 }) => {
  const [displayMessage, setDisplayMessage] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(currentStepMessage || messages[0]);

  useEffect(() => {
    // Prioritize currentStepMessage from the generation process
    if (currentStepMessage && currentStepMessage !== currentMessage) {
      setCurrentMessage(currentStepMessage);
      setDisplayMessage(currentStepMessage);
      setCharIndex(currentStepMessage.length);
      setIsDeleting(false);
      return;
    }

    // Only run typing effect if there's no currentStepMessage from the generation process
    // or if we want to cycle through general messages while waiting
    if (!currentStepMessage && messages.length > 0) {
      let typingTimer;
      const handleTyping = () => {
        const targetMessage = messages[messageIndex % messages.length];
        
        if (isDeleting) {
          setDisplayMessage(targetMessage.substring(0, charIndex - 1));
          setCharIndex(prev => prev - 1);
          if (charIndex === 0) {
            setIsDeleting(false);
            setMessageIndex(prev => prev + 1);
          }
        } else {
          setDisplayMessage(targetMessage.substring(0, charIndex + 1));
          setCharIndex(prev => prev + 1);
          if (charIndex === targetMessage.length) {
            setIsDeleting(true);
            typingTimer = setTimeout(handleTyping, interval);
            return;
          }
        }
        typingTimer = setTimeout(handleTyping, delayPerChar);
      };

      typingTimer = setTimeout(handleTyping, delayPerChar);
      return () => clearTimeout(typingTimer);
    }
  }, [charIndex, isDeleting, messageIndex, messages, currentMessage, interval, delayPerChar, currentStepMessage]);

  return <span className="font-mono text-xs md:text-sm transition-all duration-200">{displayMessage}<span className="animate-pulse">|</span></span>;
};

export default function GeneratingArticleCard({
  idea,
  generationStep,
  columnColor = 'blue',
  onClick,
}) {
  const stepText = generationStep?.text || 'Processing...';
  const isFailed = stepText.includes('Failed');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.3 }}
      className={`
        relative rounded-xl p-4 border-2 shadow-md w-full flex flex-col justify-between cursor-pointer
        ${isFailed ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-2">
        {isFailed ? (
          <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
        ) : (
          <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
        )}
        <h4 className="font-semibold text-base text-slate-900">Processing...</h4>
      </div>
      <p className="text-sm text-gray-700 mb-3 line-clamp-2 font-medium">
        {idea.title}
      </p>

      <div className="flex items-center justify-between text-slate-500 bg-white/50 p-2 rounded-lg">
        <div className="flex items-center gap-2 overflow-hidden">
          <Loader2 className="w-4 h-4 text-slate-600 flex-shrink-0 animate-spin" />
          <TypingEffect messages={[]} currentStepMessage={stepText} />
        </div>
      </div>
      {isFailed && (
        <p className="text-red-600 text-xs mt-2">Error: {stepText?.replace('❌ Failed: ', '')}</p>
      )}
    </motion.div>
  );
}