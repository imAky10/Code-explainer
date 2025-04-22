"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';

// Re-define icons here or import from a shared location
const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 4.625-2.25-2.25m0 0-2.25 2.25M13.5 12.75V17.25" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-600">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);


export default function ExplanationOutput({
  explanation,
  isLoading,
  copied, // Pass the specific copied state for explanation
  onCopy, // Pass the copy handler
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-semibold text-gray-800">Code Documentation</h2>
        {explanation && !explanation.startsWith('Error:') && !isLoading && (
          <button
            onClick={onCopy} // Use the passed handler
            title="Copy Explanation"
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        )}
      </div>
      {/* Make explanation box grow to fill available space */}
      <div className="relative bg-gray-50 border border-gray-200 p-4 rounded-lg flex-grow min-h-[200px] md:min-h-[400px] max-h-[70vh] overflow-y-auto text-sm text-gray-800 prose prose-sm max-w-none prose-pre:whitespace-pre-wrap prose-pre:break-words prose-code:text-blue-600 prose-code:bg-blue-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
        {isLoading && !explanation.startsWith('Error:') ? (
           <div className="flex justify-center items-center h-full text-gray-500">Analyzing Code and Generating Documentation...</div>
        ) : (
           <ReactMarkdown>{explanation || 'Documentation will appear here...'}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}