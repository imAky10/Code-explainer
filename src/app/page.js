"use client";

import React, { useState, useEffect, useRef } from 'react';
import CodeInputArea from '@/components/CodeInputArea';
import LanguageSelector from '@/components/LanguageSelector';
import DetailSelector from '@/components/DetailSelector';
import ActionButtons from '@/components/ActionButtons';
import ExplanationOutput from '@/components/ExplanationOutput';
import { availableLanguages, docLinks } from '@/config/languages'; // Import config

export default function Home() {
  // State variables
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('');
  const [suggestedLanguage, setSuggestedLanguage] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const debounceTimeoutRef = useRef(null);
  const [copiedStates, setCopiedStates] = useState({ explanation: false });
  const [detailLevel, setDetailLevel] = useState('summary');
  const [showCodeDisplay, setShowCodeDisplay] = useState(true);
  const [isSuggestionSupported, setIsSuggestionSupported] = useState(true);
  const [isDropdownDisabled, setIsDropdownDisabled] = useState(false);
  const [userManuallySelectedLanguage, setUserManuallySelectedLanguage] = useState(false);

  // Language config imported from '@/config/languages'

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target.result;
        setCode(fileContent);
        // Reset states when new file is loaded
        setLanguage('');
        setSuggestedLanguage('');
        setExplanation('');
        setUserManuallySelectedLanguage(false);
        setIsDropdownDisabled(false);
        setIsSuggestionSupported(true);
      };
      reader.readAsText(file);
    }
  };

  // Handler for code changes in textarea
  const handleCodeChange = (event) => {
    setCode(event.target.value);
     // Reset states potentially affected by code change
     setLanguage('');
     setSuggestedLanguage('');
     setExplanation('');
     setUserManuallySelectedLanguage(false);
     setIsDropdownDisabled(false);
     setIsSuggestionSupported(true);
  };

   // Handler for language dropdown change
   const handleLanguageChange = (event) => {
    const newlySelectedLanguage = event.target.value;
    if (suggestedLanguage && isSuggestionSupported && newlySelectedLanguage !== suggestedLanguage && newlySelectedLanguage !== '') {
      const proceed = window.confirm(`The suggested language is ${suggestedLanguage}, but you selected ${newlySelectedLanguage}. Proceed with ${newlySelectedLanguage}?`);
      if (proceed) {
        setLanguage(newlySelectedLanguage);
        setUserManuallySelectedLanguage(true);
      }
      // If user cancels, do nothing
    } else {
      setLanguage(newlySelectedLanguage);
      if (newlySelectedLanguage === suggestedLanguage) {
        setUserManuallySelectedLanguage(false);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!code || !language) {
      alert("Please upload code and select a language.");
      return;
    }
    setIsLoading(true);
    setExplanation('Generating explanation...');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json', // Expect JSON
        },
        body: JSON.stringify({ code, language, detailLevel, languageManuallySelected: userManuallySelectedLanguage }),
      });

      if (!response.ok) {
        let errorMsg = `API request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (parseError) {
          errorMsg = `${errorMsg}: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      // Process standard JSON response
      const data = await response.json();
      setExplanation(data.explanation || 'No explanation received.');


    } catch (error) {
      console.error("Analysis error:", error.message);
      const displayError = `Error: ${error.message || 'An unknown error occurred during analysis.'}`;
      setExplanation(displayError);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Language Detection Logic ---
  const detectLanguage = async (currentCode) => {
    if (!currentCode || currentCode.trim().length < 10) {
      setSuggestedLanguage('');
      setIsDropdownDisabled(false); // Ensure dropdown is enabled if code is too short
      setUserManuallySelectedLanguage(false); // Reset flag
      return;
    }
    setIsDetecting(true);
    setSuggestedLanguage('Detecting...');
    setIsSuggestionSupported(true);
    setIsDropdownDisabled(false);
    setUserManuallySelectedLanguage(false);

    try {
      const response = await fetch('/api/detect-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: currentCode }),
      });

      if (!response.ok) {
        throw new Error(`Detection API failed: ${response.statusText}`);
      }

      const data = await response.json();
      const detected = data.suggestedLanguage || 'Unknown';
      const isSupported = availableLanguages.includes(detected);
      setSuggestedLanguage(detected);
      setIsSuggestionSupported(isSupported);

      if (isSupported) {
        setLanguage(detected); // Auto-select if supported
        setIsDropdownDisabled(false);
      } else if (detected !== 'Unknown' && detected !== 'Error') {
        alert(`Suggested: ${detected}\n\nThis language is not currently supported for analysis. Please select a supported language or try different code.`);
        setIsDropdownDisabled(true);
        setLanguage('');
      } else {
        setIsDropdownDisabled(false);
      }

    } catch (error) {
      console.error("Language detection error:", error);
      setSuggestedLanguage('Error');
      setIsSuggestionSupported(false);
      setIsDropdownDisabled(true);
    } finally {
      setIsDetecting(false);
    }
  };

  // Effect hook for debounced language detection
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      detectLanguage(code);
    }, 750);
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [code]); // Rerun only when code changes

  const handleClearInput = () => {
    const CODE_LENGTH_THRESHOLD = 100;
    let confirmed = true;

    if (code.length > CODE_LENGTH_THRESHOLD) {
      confirmed = window.confirm("Are you sure you want to clear the code input? This action cannot be undone.");
    }

    if (confirmed) {
      setCode('');
      setExplanation('');
      setLanguage('');
      setSuggestedLanguage('');
      setIsSuggestionSupported(true);
      setIsDropdownDisabled(false);
      setUserManuallySelectedLanguage(false);
      setShowCodeDisplay(true); // Reset code display toggle
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates(prev => ({ ...prev, explanation: true }));
      setTimeout(() => setCopiedStates(prev => ({ ...prev, explanation: false })), 1500);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert('Failed to copy text.');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 text-gray-900">
      <header className="w-full max-w-6xl mb-10">
        <h1 className="text-4xl font-bold text-center text-gray-800">
          Code Explainer AI
        </h1>
        <p className="text-center text-gray-600 mt-2">Upload or paste your code to get instant explanations.</p>
      </header>

      <main className="w-full max-w-6xl flex-grow bg-white shadow-xl rounded-xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

        {/* Input Section */}
        <section className="space-y-6">
          {/* File Upload */}
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Upload Code File
            </label>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-5 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              accept=".py,.js,.java,.c,.cpp,.cs,.go,.rb,.php,.swift,.kt,.ts,.tsx,.jsx"
            />
          </div>

          <CodeInputArea
            code={code}
            language={language}
            showCodeDisplay={showCodeDisplay}
            onCodeChange={handleCodeChange} // Pass specific handler
            onClearInput={handleClearInput}
            onToggleShowCode={(e) => setShowCodeDisplay(e.target.checked)}
          />

          <LanguageSelector
            language={language}
            suggestedLanguage={suggestedLanguage}
            isDetecting={isDetecting}
            isSuggestionSupported={isSuggestionSupported}
            isDropdownDisabled={isDropdownDisabled}
            availableLanguages={availableLanguages}
            docLinks={docLinks}
            onLanguageChange={handleLanguageChange} // Pass specific handler
          />

          <DetailSelector
            detailLevel={detailLevel}
            onDetailChange={(e) => setDetailLevel(e.target.value)}
          />

          <ActionButtons
            isLoading={isLoading}
            isDetecting={isDetecting}
            code={code}
            language={language}
            onAnalyze={handleAnalyze}
          />
        </section>

        {/* Results Section */}
        <section className="space-y-6 md:space-y-8 flex flex-col h-full">
           <ExplanationOutput
             explanation={explanation}
             isLoading={isLoading}
             copied={copiedStates.explanation}
             onCopy={() => copyToClipboard(explanation)}
           />
        </section>
      </main>

      <footer className="w-full max-w-6xl mt-12 text-center text-sm text-gray-500">
        Powered by AI
      </footer>
    </div>
  );
}
