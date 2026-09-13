import React from 'react';

interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient';
  animated?: boolean;
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBar({
  value,
  className = '',
  showLabel = true,
  size = 'md',
  variant = 'gradient',
  animated = true,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-indigo-700">Progress</span>
          <span className="text-xs font-bold text-indigo-900">{clamped}%</span>
        </div>
      )}
      <div
        className={`w-full bg-indigo-100 rounded-full overflow-hidden ${sizeClasses[size]}`}
      >
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 ease-out animate-progress-fill"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
