interface StepperProps {
  steps: string[];
  activeStep: string;
}

const Stepper = ({ steps, activeStep }: StepperProps) => {
  const activeIndex = steps.indexOf(activeStep);
  return (
    <div className="stepper">
      {steps.map((step, index) => (
        <div key={step} className={`step ${index <= activeIndex ? 'active' : ''}`}>
          <div className="step-dot" />
          <div className="step-label">{step}</div>
        </div>
      ))}
    </div>
  );
};

export default Stepper;
