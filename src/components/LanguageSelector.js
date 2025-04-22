"use client";

import React from 'react';

export default function LanguageSelector({
  language,
  suggestedLanguage,
  isDetecting,
  isSuggestionSupported,
  isDropdownDisabled,
  availableLanguages,
  docLinks,
  onLanguageChange, // Expecting the full onChange handler function from parent
}) {
  return (
    <div>
      <label htmlFor="language-select" className="flex items-center text-sm font-medium text-gray-700 mb-2">
        Select Language
        {isDetecting && <span className="ml-2 text-xs text-gray-500">Detecting...</span>}
        {/* Show blue badge if supported */}
        {!isDetecting && suggestedLanguage && isSuggestionSupported && suggestedLanguage !== 'Unknown' && suggestedLanguage !== 'Error' && (
          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Suggested: {suggestedLanguage}
          </span>
        )}
        {/* Show red badge if unsupported */}
        {!isDetecting && suggestedLanguage && !isSuggestionSupported && suggestedLanguage !== 'Unknown' && suggestedLanguage !== 'Error' && (
           <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
             Suggested: {suggestedLanguage} (Unsupported)
           </span>
        )}
      </label>
      <select
        id="language-select"
        value={language}
        onChange={onLanguageChange} // Pass the handler directly
        className={`block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg shadow-sm text-gray-900 bg-white ${isDropdownDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isDropdownDisabled}
      >
        <option value="">-- Select Language --</option>
        {availableLanguages.map(lang => (
          <option key={lang} value={lang}>{lang}</option>
        ))}
      </select>
      {/* Conditionally render documentation link */}
      {language && docLinks[language] && (
        <div className="mt-2 text-right">
          <a
            href={docLinks[language]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            View Official {language} Documentation &rarr;
          </a>
        </div>
      )}
    </div>
  );
}