/**
 * Work Hours Calculator - Calculation Engine
 */

(function (root, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory();
  } else {
    root.WorkCalculator = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Formats duration in minutes into clean human-readable text.
   * e.g. 346 -> "5h 46m", 180 -> "3h", 45 -> "45m", 0 -> "0m"
   * @param {number} totalMinutes 
   * @returns {string}
   */
  function formatDuration(totalMinutes) {
    if (typeof totalMinutes !== 'number' || isNaN(totalMinutes) || totalMinutes < 0) {
      return '0m';
    }

    const rounded = Math.round(totalMinutes);
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;

    if (h > 0 && m > 0) {
      return h + 'h ' + m + 'm';
    } else if (h > 0 && m === 0) {
      return h + 'h';
    } else {
      return m + 'm';
    }
  }

  /**
   * Formats target duration with 2-digit minutes (e.g. "8h 00m", "8h 15m")
   * @param {number} totalMinutes 
   * @returns {string}
   */
  function formatTargetDuration(totalMinutes) {
    if (typeof totalMinutes !== 'number' || isNaN(totalMinutes) || totalMinutes < 0) {
      return '8h 00m';
    }
    const rounded = Math.round(totalMinutes);
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;
    return h + 'h ' + String(m).padStart(2, '0') + 'm';
  }

  /**
   * Formats minute of day to 24-hour time HH:MM
   * @param {number} totalMinutes 
   * @returns {{ timeStr: string, isNextDay: boolean, dayOffset: number }}
   */
  function formatTime(totalMinutes) {
    if (typeof totalMinutes !== 'number' || isNaN(totalMinutes)) {
      return { timeStr: '--:--', isNextDay: false, dayOffset: 0 };
    }

    const dayOffset = Math.floor(totalMinutes / 1440);
    const norm = ((totalMinutes % 1440) + 1440) % 1440;
    const h = String(Math.floor(norm / 60)).padStart(2, '0');
    const m = String(norm % 60).padStart(2, '0');

    return {
      timeStr: h + ':' + m,
      isNextDay: dayOffset > 0,
      dayOffset: dayOffset
    };
  }

  /**
   * Converts target hours (decimal or integer) to integer minutes
   * @param {number|string} targetHours 
   * @returns {number}
   */
  function parseTargetHoursToMinutes(targetHours) {
    const num = parseFloat(targetHours);
    if (isNaN(num) || num <= 0) {
      return 480; // default 8 hours
    }
    return Math.round(num * 60);
  }

  /**
   * Main schedule calculation function
   * @param {Array} punches Array of parsed punches from PunchParser
   * @param {number|string} targetHours Daily target in hours (default 8)
   * @param {number} currentMinutes Current time expressed in total minutes from 00:00
   * @returns {object} Calculated schedule details
   */
  function calculateSchedule(punches, targetHours, currentMinutes) {
    if (!Array.isArray(punches) || punches.length === 0) {
      return {
        success: false,
        error: 'Paste your punch details to calculate your leaving time.'
      };
    }

    const targetMinutes = parseTargetHoursToMinutes(targetHours);
    const numPunches = punches.length;
    const isLastPunchIn = numPunches % 2 !== 0;

    const workIntervals = [];
    const breakIntervals = [];

    // Calculate Work Intervals (Pairs: 0->1, 2->3, ...)
    for (let i = 0; i < numPunches; i += 2) {
      const punchIn = punches[i];
      if (i + 1 < numPunches) {
        const punchOut = punches[i + 1];
        const duration = Math.max(0, punchOut.totalMinutes - punchIn.totalMinutes);
        workIntervals.push({
          type: 'WORK',
          in: punchIn,
          out: punchOut,
          duration: duration,
          isActive: false
        });
      } else {
        // Last punch is IN: active working interval until current time
        const duration = Math.max(0, currentMinutes - punchIn.totalMinutes);
        workIntervals.push({
          type: 'WORK',
          in: punchIn,
          out: null,
          duration: duration,
          isActive: true
        });
      }
    }

    // Calculate Break Intervals (Pairs: 1->2, 3->4, ...)
    for (let i = 1; i < numPunches; i += 2) {
      const punchOut = punches[i];
      if (i + 1 < numPunches) {
        const punchIn = punches[i + 1];
        const duration = Math.max(0, punchIn.totalMinutes - punchOut.totalMinutes);
        breakIntervals.push({
          type: 'BREAK',
          out: punchOut,
          in: punchIn,
          duration: duration
        });
      }
    }

    // Total worked & break minutes
    const workedMinutes = workIntervals.reduce(function (sum, item) {
      return sum + item.duration;
    }, 0);

    const breakMinutes = breakIntervals.reduce(function (sum, item) {
      return sum + item.duration;
    }, 0);

    const remainingMinutes = Math.max(0, targetMinutes - workedMinutes);
    const isCompleted = workedMinutes >= targetMinutes;

    let leavingTimeObj = null;
    let leavingTimeMinutes = null;
    let statusMessage = '';

    const targetHoursNum = parseFloat(targetHours) || 8;
    const targetLabel = Number.isInteger(targetHoursNum)
      ? targetHoursNum + '-hour'
      : targetHoursNum + 'h';

    if (isCompleted) {
      statusMessage = targetLabel + ' work target completed';
    } else {
      if (isLastPunchIn) {
        // Currently working: leaving time is current time + remaining work
        leavingTimeMinutes = currentMinutes + remainingMinutes;
        leavingTimeObj = formatTime(leavingTimeMinutes);
        statusMessage = 'You can leave at ' + leavingTimeObj.timeStr;
      } else {
        // Currently punched OUT: leaving time assuming resumption at current time
        leavingTimeMinutes = currentMinutes + remainingMinutes;
        leavingTimeObj = formatTime(leavingTimeMinutes);
        statusMessage = 'Assuming work resumes now (' + formatTime(currentMinutes).timeStr + ')';
      }
    }

    return {
      success: true,
      targetHours: targetHoursNum,
      targetMinutes: targetMinutes,
      currentMinutes: currentMinutes,
      currentTimeFormatted: formatTime(currentMinutes).timeStr,
      workedMinutes: workedMinutes,
      workedFormatted: formatDuration(workedMinutes),
      breakMinutes: breakMinutes,
      breakFormatted: formatDuration(breakMinutes),
      remainingMinutes: remainingMinutes,
      remainingFormatted: formatDuration(remainingMinutes),
      isCompleted: isCompleted,
      isCurrentlyWorking: isLastPunchIn,
      isPunchedOut: !isLastPunchIn,
      leavingTimeMinutes: leavingTimeMinutes,
      leavingTimeFormatted: leavingTimeObj ? leavingTimeObj.timeStr : null,
      isNextDay: leavingTimeObj ? leavingTimeObj.isNextDay : false,
      statusMessage: statusMessage,
      targetCompletedText: targetLabel + ' work target completed',
      workIntervals: workIntervals,
      breakIntervals: breakIntervals
    };
  }

  return {
    formatDuration: formatDuration,
    formatTargetDuration: formatTargetDuration,
    formatTime: formatTime,
    parseTargetHoursToMinutes: parseTargetHoursToMinutes,
    calculateSchedule: calculateSchedule
  };
});
