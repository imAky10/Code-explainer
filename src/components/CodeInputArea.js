"use client";

import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CodeInputArea({
  code,
  language,
  showCodeDisplay,
  onCodeChange,
  onClearInput,
  onToggleShowCode,
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="code-input" className="block text-sm font-medium text-gray-700">
          Or Paste Code Here:
        </label>
        {code && ( // Conditionally render Clear button
          <button
            onClick={onClearInput}
            className="text-xs text-gray-500 hover:text-red-600 transition-colors"
            title="Clear Input"
          >
            Clear
          </button>
        )}
      </div>
      <textarea
        id="code-input"
        rows="12"
        className="block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono text-gray-900 bg-white resize-none"
        placeholder="Paste your code snippet here..."
        value={code}
        onChange={onCodeChange} // Pass the handler up
        spellCheck="false"
      ></textarea>
      {/* Toggle for showing/hiding highlighted code */}
      {code && (
        <div className="mt-2 flex items-center">
          <input
            type="checkbox"
            id="show-code-toggle"
            checked={showCodeDisplay}
            onChange={onToggleShowCode} // Pass the handler up
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="show-code-toggle" className="ml-2 text-xs text-gray-600">Show highlighted code</label>
        </div>
      )}
      {/* Display highlighted code below textarea if code exists AND toggle is checked */}
      {code && showCodeDisplay && (
        <div className="mt-1 rounded-lg shadow-sm font-mono text-sm border border-gray-200 max-h-60 overflow-y-auto bg-gray-50 whitespace-pre-wrap break-words">
          <SyntaxHighlighter
            language={language ? language.toLowerCase() : 'text'}
            style={oneLight}
            showLineNumbers
            wrapLines={true}
            customStyle={{ margin: 0, padding: '0.75rem' }}
            codeTagProps={{ style: { fontFamily: 'inherit' } }}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  );
}