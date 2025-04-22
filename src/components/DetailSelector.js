"use client";

import React from 'react';

export default function DetailSelector({ detailLevel, onDetailChange }) {
  return (
    <div className="pt-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">Explanation Detail Level</label>
      <fieldset className="mt-1">
        <legend className="sr-only">Explanation detail level</legend>
        <div className="flex items-center space-x-6"> {/* Increased spacing */}
          <div className="flex items-center">
            <input
              id="detail-summary"
              name="detailLevel"
              type="radio"
              value="summary"
              checked={detailLevel === 'summary'}
              onChange={onDetailChange} // Pass the handler up
              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
            />
            <label htmlFor="detail-summary" className="ml-2 block text-sm text-gray-900">
              Summary
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="detail-detailed"
              name="detailLevel"
              type="radio"
              value="detailed"
              checked={detailLevel === 'detailed'}
              onChange={onDetailChange} // Pass the handler up
              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
            />
            <label htmlFor="detail-detailed" className="ml-2 block text-sm text-gray-900">
              Detailed
            </label>
          </div>
        </div>
      </fieldset>
    </div>
  );
}