import React, { useState } from 'react';
import { Volume2, Mic, Flame, ChevronRight, X, Sparkles } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome, Young Explorer! 🐥",
      description: "You are the pilot of a cute little bird. Your powerful voice is the fuel that helps our bird glide through the bright beautiful clouds!",
      emoji: "🌟",
      icon: <Sparkles className="w-8 h-8 text-amber-500 animate-bounce" />,
      color: "bg-amber-50 text-amber-900 border-amber-200"
    },
    {
      title: "Step 1: Click & Listen 🔊",
      description: "Stuck or not sure how to say a word? No problem! Just click on any cloud or phrase on the screen, and the game will pronounce it out loud for you. Listen carefully!",
      emoji: "🔊",
      icon: <Volume2 className="w-8 h-8 text-emerald-500 animate-pulse" />,
      color: "bg-emerald-50 text-emerald-900 border-emerald-200"
    },
    {
      title: "Step 2: Read Out Loud 🎙️",
      description: "When the game asks for a word, press the big 'Listen' button and say the English phrase. Don't worry about being absolutely perfect; the game is forgiving and loves to hear your voice!",
      emoji: "🎤",
      icon: <Mic className="w-8 h-8 text-blue-500" />,
      color: "bg-blue-50 text-blue-900 border-blue-200"
    },
    {
      title: "Step 3: Fly to the Clouds! ☁️",
      description: "As you speak each level's step correctly, the cloud glows bright green and your bird leaps forward! Complete full sentences to clear levels and unlock magical new environments!",
      emoji: "🔥",
      icon: <Flame className="w-8 h-8 text-rose-500" />,
      color: "bg-rose-50 text-rose-900 border-rose-200"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(0);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col transform transition-all">
        {/* Header decoration */}
        <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <span className="font-bold text-sm tracking-wide uppercase">Sentence Bird Academy</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-emerald-200 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 flex-1 flex flex-col items-center text-center">
          {/* Circular icon container */}
          <div className={`p-4 rounded-full border mb-4 ${steps[currentStep].color}`}>
            {steps[currentStep].icon}
          </div>

          <h3 className="text-xl font-bold text-slate-800 mb-2">
            {steps[currentStep].title}
          </h3>
          
          <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
            {steps[currentStep].description}
          </p>

          {/* Step indicators */}
          <div className="flex gap-1.5 mt-8 mb-2">
            {steps.map((_, idx) => (
              <span 
                key={idx} 
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-emerald-600' : 'w-2 bg-slate-200'}`}
              />
            ))}
          </div>
        </div>

        {/* Footer controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 font-medium hover:text-slate-600"
          >
            Skip Tutorial
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all shadow-emerald-200"
          >
            {currentStep === steps.length - 1 ? "Let's Play!" : "Next Tip"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
