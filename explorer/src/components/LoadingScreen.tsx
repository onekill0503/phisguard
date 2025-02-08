import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        {/* <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" /> */}
        <img src="/walk.gif" alt="" className='m-auto'/>
        <p className="mt-4 text-gray-600 text-lg">Loading data...</p>
      </div>
    </div>
  );
};