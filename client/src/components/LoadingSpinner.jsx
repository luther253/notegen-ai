import React from 'react';

// Rotating gradient spinner
export function LoadingSpinner({ size = 'md', text }) {
  const sizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-3',
    lg: 'h-16 w-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6">
      <div
        className={`${sizes[size]} animate-spin rounded-full border-solid border-[rgb(var(--accent-color))] border-t-transparent`}
      />
      {text && (
        <p className="text-xs font-semibold text-gray-500 animate-pulse">{text}</p>
      )}
    </div>
  );
}

// Modular Notion-like skeleton placeholder loader
export function LoadingSkeleton({ type = 'notes' }) {
  if (type === 'notes') {
    return (
      <div className="w-full space-y-4 animate-pulse">
        {/* Title skeleton */}
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/3" />
        
        {/* Meta data items */}
        <div className="flex gap-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-16" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-24" />
        </div>

        {/* Content rows */}
        <div className="space-y-2.5 pt-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-5/6" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-4/5" />
        </div>

        <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/4 pt-6" />

        <div className="space-y-2.5 pt-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-full" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-11/12" />
        </div>
      </div>
    );
  }

  // Card list skeletons
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="glass-panel p-5 rounded-2xl border border-gray-200/10 space-y-3">
          <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded-md w-2/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-md w-1/2" />
          <div className="space-y-1.5 pt-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-md w-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-md w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
