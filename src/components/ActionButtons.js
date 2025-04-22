"use client";

import React from 'react';

export default function ActionButtons({
  isLoading,
  isDetecting,
  code,
  language,
  onAnalyze,
}) {
  return (
    <button
      onClick={onAnalyze}
      disabled={isLoading || isDetecting || !code || !language}
      className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading || isDetecting || !code || !language ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
    >
      {isLoading || isDetecting ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {isLoading ? 'Analyzing...' : 'Detecting...'}
        </>
      ) : (
        'Analyze Code'
      )}
    </button>
  );
}