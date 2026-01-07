import { useState, useCallback } from 'react';
import type { WizardStep } from '../types/index.js';

const STEP_ORDER: WizardStep[] = [
  'init',
  'scope',
  'criteria',
  'loading',
  'select',
  'confirm',
  'execute',
  'summary',
];

export function useWizard(initialStep: WizardStep = 'init') {
  const [step, setStep] = useState<WizardStep>(initialStep);

  const nextStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex < STEP_ORDER.length - 1) {
      setStep(STEP_ORDER[currentIndex + 1]);
    }
  }, [step]);

  const prevStep = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 0) {
      setStep(STEP_ORDER[currentIndex - 1]);
    }
  }, [step]);

  const goToStep = useCallback((newStep: WizardStep) => {
    setStep(newStep);
  }, []);

  return {
    step,
    nextStep,
    prevStep,
    goToStep,
  };
}
