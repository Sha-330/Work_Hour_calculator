/**
 * Work Hours Calculator - Application Controller
 */

(function () {
  'use strict';

  // DOM Elements
  const punchInput = document.getElementById('punchInput');
  const targetInput = document.getElementById('targetInput');
  const calcBtn = document.getElementById('calcBtn');
  const clearBtn = document.getElementById('clearBtn');
  const currentTimeVal = document.getElementById('currentTimeVal');
  const targetDisplay = document.getElementById('targetDisplay');
  const toggleSimulateBtn = document.getElementById('toggleSimulateBtn');
  const simulateBox = document.getElementById('simulateBox');
  const customTimeInput = document.getElementById('customTimeInput');
  const resetTimeBtn = document.getElementById('resetTimeBtn');
  const liveDot = document.getElementById('liveDot');
  const liveStatusText = document.getElementById('liveStatusText');

  const validationMessage = document.getElementById('validationMessage');
  const resultsSection = document.getElementById('resultsSection');
  const emptyState = document.getElementById('emptyState');

  const workedVal = document.getElementById('workedVal');
  const breakVal = document.getElementById('breakVal');
  const remainingVal = document.getElementById('remainingVal');

  const resultCard = document.getElementById('resultCard');
  const resultSubhead = document.getElementById('resultSubhead');
  const leavingTimeVal = document.getElementById('leavingTimeVal');
  const resultNote = document.getElementById('resultNote');
  const copyBtn = document.getElementById('copyBtn');
  const intervalsList = document.getElementById('intervalsList');
  const toast = document.getElementById('toast');

  // State
  let simulatedMinutes = null;
  let lastScheduleResult = null;
  let toastTimer = null;

  /**
   * Returns current time in minutes from 00:00.
   */
  function getCurrentMinutes() {
    if (simulatedMinutes !== null) {
      return simulatedMinutes;
    }
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  /**
   * Updates the clock display in the UI.
   */
  function updateClockDisplay() {
    const mins = getCurrentMinutes();
    const formatted = WorkCalculator.formatTime(mins).timeStr;
    currentTimeVal.textContent = formatted;

    if (simulatedMinutes !== null) {
      liveDot.style.backgroundColor = '#f59e0b';
      liveStatusText.textContent = 'Simulated Time';
    } else {
      liveDot.style.backgroundColor = '#16a34a';
      liveStatusText.textContent = 'Live Browser Time';
    }
  }

  /**
   * Updates the target display badge.
   */
  function updateTargetBadge() {
    const targetHours = targetInput.value;
    const targetMins = WorkCalculator.parseTargetHoursToMinutes(targetHours);
    targetDisplay.textContent = WorkCalculator.formatTargetDuration(targetMins);
  }

  /**
   * Shows error message and hides results.
   */
  function showError(message) {
    validationMessage.textContent = message;
    validationMessage.style.display = 'flex';
    resultsSection.style.display = 'none';
    emptyState.style.display = 'none';
    lastScheduleResult = null;
  }

  /**
   * Resets error message.
   */
  function hideError() {
    validationMessage.textContent = '';
    validationMessage.style.display = 'none';
  }

  /**
   * Shows toast notification with fallback.
   */
  function showToast(message) {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 2500);
  }

  /**
   * Renders the intervals timeline.
   */
  function renderIntervals(schedule, parsedPunches) {
    intervalsList.innerHTML = '';

    const maxLen = Math.max(schedule.workIntervals.length, schedule.breakIntervals.length);

    for (let i = 0; i < maxLen; i++) {
      if (i < schedule.workIntervals.length) {
        const w = schedule.workIntervals[i];
        if (w.isActive) {
          intervalsList.insertAdjacentHTML('beforeend',
            '<div class="interval-item work active">' +
            '<span class="interval-type" style="color: var(--primary);">Active Work</span>' +
            '<span class="interval-times">' + w.in.timeStr + ' → ' + schedule.currentTimeFormatted + ' (Now)</span>' +
            '<span class="interval-duration">' + WorkCalculator.formatDuration(w.duration) + '</span>' +
            '</div>'
          );
        } else {
          intervalsList.insertAdjacentHTML('beforeend',
            '<div class="interval-item work">' +
            '<span class="interval-type" style="color: var(--primary);">Work</span>' +
            '<span class="interval-times">' + w.in.timeStr + ' → ' + w.out.timeStr + '</span>' +
            '<span class="interval-duration">' + WorkCalculator.formatDuration(w.duration) + '</span>' +
            '</div>'
          );
        }
      }

      if (i < schedule.breakIntervals.length) {
        const b = schedule.breakIntervals[i];
        intervalsList.insertAdjacentHTML('beforeend',
          '<div class="interval-item break">' +
          '<span class="interval-type" style="color: #b45309;">Break</span>' +
          '<span class="interval-times">' + b.out.timeStr + ' → ' + b.in.timeStr + '</span>' +
          '<span class="interval-duration">' + WorkCalculator.formatDuration(b.duration) + '</span>' +
          '</div>'
        );
      }
    }
  }

  /**
   * Main calculation and UI render runner.
   */
  function performCalculation() {
    updateClockDisplay();
    updateTargetBadge();

    const rawText = punchInput.value;

    if (!rawText || !rawText.trim()) {
      hideError();
      resultsSection.style.display = 'none';
      emptyState.style.display = 'flex';
      lastScheduleResult = null;
      return;
    }

    const parseResult = PunchParser.parsePunchTimes(rawText);

    if (!parseResult.valid) {
      showError(parseResult.error);
      return;
    }

    hideError();
    emptyState.style.display = 'none';

    const currentMins = getCurrentMinutes();
    const targetHours = targetInput.value;
    const schedule = WorkCalculator.calculateSchedule(parseResult.punches, targetHours, currentMins);

    lastScheduleResult = schedule;

    // Render Metrics
    workedVal.textContent = schedule.workedFormatted;
    breakVal.textContent = schedule.breakFormatted;
    remainingVal.textContent = schedule.remainingFormatted;

    // Render Leaving Card
    if (schedule.isCompleted) {
      resultCard.classList.add('completed');
      resultSubhead.textContent = schedule.targetCompletedText;
      leavingTimeVal.textContent = 'You can leave now ✓';
      resultNote.textContent = '';
    } else {
      resultCard.classList.remove('completed');
      resultSubhead.textContent = 'You can leave at';
      leavingTimeVal.textContent = schedule.leavingTimeFormatted + (schedule.isNextDay ? ' (+1 day)' : '');

      if (schedule.isPunchedOut) {
        resultNote.textContent = 'Currently punched OUT. Leaving time assumes resuming work now (' + schedule.currentTimeFormatted + ').';
      } else {
        resultNote.textContent = '';
      }
    }

    // Render Intervals Breakdown
    renderIntervals(schedule, parseResult.punches);

    resultsSection.style.display = 'block';
  }

  /**
   * Copy Result functionality
   */
  function copyResultToClipboard() {
    if (!lastScheduleResult) {
      return;
    }

    let copyText = '';
    if (lastScheduleResult.isCompleted) {
      copyText = 'Worked: ' + lastScheduleResult.workedFormatted + '\n' +
        'Break: ' + lastScheduleResult.breakFormatted + '\n' +
        'Remaining: 0m\n' +
        'Status: ' + lastScheduleResult.targetCompletedText + ' - You can leave now ✓';
    } else {
      copyText = 'Worked: ' + lastScheduleResult.workedFormatted + '\n' +
        'Break: ' + lastScheduleResult.breakFormatted + '\n' +
        'Remaining: ' + lastScheduleResult.remainingFormatted + '\n' +
        'Leave at: ' + lastScheduleResult.leavingTimeFormatted + (lastScheduleResult.isNextDay ? ' (+1 day)' : '');
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(copyText).then(function () {
        showToast('Copied to clipboard!');
      }).catch(function () {
        fallbackCopyText(copyText);
      });
    } else {
      fallbackCopyText(copyText);
    }
  }

  /**
   * Fallback copy text using temporary textarea
   */
  function fallbackCopyText(text) {
    const tempInput = document.createElement('textarea');
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      showToast('Copied to clipboard!');
    } catch (e) {
      showToast('Please copy manually');
    }
    document.body.removeChild(tempInput);
  }

  /**
   * Clear all inputs and state
   */
  function clearAll() {
    punchInput.value = '';
    targetInput.value = '8';
    hideError();
    resultsSection.style.display = 'none';
    emptyState.style.display = 'flex';
    lastScheduleResult = null;
    updateTargetBadge();
    punchInput.focus();
  }

  // Event Listeners
  calcBtn.addEventListener('click', performCalculation);
  clearBtn.addEventListener('click', clearAll);
  copyBtn.addEventListener('click', copyResultToClipboard);

  punchInput.addEventListener('input', performCalculation);
  punchInput.addEventListener('paste', function () {
    setTimeout(performCalculation, 50);
  });

  targetInput.addEventListener('input', function () {
    updateTargetBadge();
    if (punchInput.value.trim()) {
      performCalculation();
    }
  });

  // Time simulation controls
  toggleSimulateBtn.addEventListener('click', function () {
    simulateBox.classList.toggle('active');
    if (simulateBox.classList.contains('active')) {
      const cur = WorkCalculator.formatTime(getCurrentMinutes()).timeStr;
      customTimeInput.value = cur;
    }
  });

  customTimeInput.addEventListener('input', function () {
    const val = customTimeInput.value;
    if (val && val.includes(':')) {
      const parts = val.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        simulatedMinutes = h * 60 + m;
        performCalculation();
      }
    }
  });

  resetTimeBtn.addEventListener('click', function () {
    simulatedMinutes = null;
    simulateBox.classList.remove('active');
    performCalculation();
    showToast('Reset to live browser clock');
  });

  // Expose test helper globally for programmatic testing in browser console/automation
  window.__setTestTime = function (timeStr) {
    if (!timeStr) {
      simulatedMinutes = null;
    } else {
      const parts = timeStr.split(':');
      simulatedMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }
    performCalculation();
  };

  // Initial execution & periodic ticker
  updateClockDisplay();
  updateTargetBadge();

  // Tick every 10 seconds to update live clock and recalculate active punch
  setInterval(function () {
    const prevTimeText = currentTimeVal.textContent;
    updateClockDisplay();
    // If the minute changed and user has active punch, recalculate dynamically
    if (currentTimeVal.textContent !== prevTimeText && punchInput.value.trim()) {
      performCalculation();
    }
  }, 10000);

})();
