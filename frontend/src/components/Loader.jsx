import React from 'react';
import { Loader } from 'lucide-react';

const LoaderComponent = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex items-center justify-center">
      <Loader className={`${sizeClasses[size]} animate-spin text-gray-500`} />
    </div>
  );
};

export default LoaderComponent;

