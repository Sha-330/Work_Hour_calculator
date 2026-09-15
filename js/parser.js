/**
 * Work Hours Calculator - Punch Parser
 */

(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else {
    root.PunchParser = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Parses raw punch attendance text and extracts validated punch times.
   * @param {string} rawInput 
   * @returns {{ valid: boolean, error?: string, punches?: Array, isLastPunchIn?: boolean, isEmpty?: boolean }}
   */
  function parsePunchTimes(rawInput) {
    if (!rawInput || typeof rawInput !== 'string' || !rawInput.trim()) {
      return {
        valid: false,
        error: 'Paste your punch details to calculate your leaving time.',
        isEmpty: true
      };
    }

    const trimmed = rawInput.trim();

    // If the string contains "Punch Times:", extract the part after it,
    // but fall back to the whole string if not found.
    let textToScan = trimmed;
    const punchTimesIndex = trimmed.search(/punch\s*times\s*:/i);
    if (punchTimesIndex !== -1) {
      textToScan = trimmed.slice(punchTimesIndex + 'punch times:'.length);
    }

    // Match time tokens like "9:13", "09:13", "16:18"
    const timeRegex = /\b(\d{1,2}):(\d{2})\b/g;
    const matches = [];
    let match;

    while ((match = timeRegex.exec(textToScan)) !== null) {
      matches.push({
        raw: match[0],
        hours: parseInt(match[1], 10),
        minutes: parseInt(match[2], 10)
      });
    }

    // If no matches found in the slice, try scanning the entire string
    if (matches.length === 0 && punchTimesIndex !== -1) {
      while ((match = timeRegex.exec(trimmed)) !== null) {
        matches.push({
          raw: match[0],
          hours: parseInt(match[1], 10),
          minutes: parseInt(match[2], 10)
        });
      }
    }

    if (matches.length === 0) {
      return {
        valid: false,
        error: 'Could not find valid punch times.'
      };
    }

    const punches = [];
    let lastTotalMinutes = -1;

    for (let i = 0; i < matches.length; i++) {
      const item = matches[i];

      // Validate hour & minute boundaries
      if (item.hours < 0 || item.hours > 23 || item.minutes < 0 || item.minutes > 59) {
        return {
          valid: false,
          error: 'Could not find valid punch times.'
        };
      }

      const totalMinutes = item.hours * 60 + item.minutes;

      // Chronological validation: strictly increasing
      if (totalMinutes <= lastTotalMinutes) {
        return {
          valid: false,
          error: 'Punch times must be in chronological order.'
        };
      }

      lastTotalMinutes = totalMinutes;

      const formattedHour = String(item.hours).padStart(2, '0');
      const formattedMinute = String(item.minutes).padStart(2, '0');

      punches.push({
        index: i,
        type: i % 2 === 0 ? 'IN' : 'OUT',
        hours: item.hours,
        minutes: item.minutes,
        totalMinutes: totalMinutes,
        timeStr: formattedHour + ':' + formattedMinute,
        raw: item.raw
      });
    }

    return {
      valid: true,
      punches: punches,
      isLastPunchIn: punches.length % 2 !== 0
    };
  }

  return {
    parsePunchTimes: parsePunchTimes
  };
});
