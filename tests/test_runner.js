const { parsePunchTimes } = require('../js/parser');
const { calculateSchedule, formatDuration, formatTargetDuration, parseTargetHoursToMinutes } = require('../js/calculator');

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`[FAIL] ${testName} - ${details}`);
    failedCount++;
  }
}

console.log('=== Running Work Hours Calculator Complete Test Suite ===\n');

// Test A1: Primary example with raw prefix
const inputA1 = 'Punch Hours:**4.25**Punch Times:9:13, 11:12, 12:01, 12:58, 13:28';
const parseA1 = parsePunchTimes(inputA1);
assert(parseA1.valid === true, 'Test A1 - Parse formatted punch string');
assert(parseA1.punches.length === 5, 'Test A1 - Extracted 5 punches');

const currA = 16 * 60 + 18; // 16:18 = 978m
const calcA1 = calculateSchedule(parseA1.punches, 8, currA);
assert(calcA1.workedFormatted === '5h 46m', `Test A1 - Worked so far: expected 5h 46m, got ${calcA1.workedFormatted}`);
assert(calcA1.breakFormatted === '1h 19m', `Test A1 - Break time: expected 1h 19m, got ${calcA1.breakFormatted}`);
assert(calcA1.remainingFormatted === '2h 14m', `Test A1 - Remaining work: expected 2h 14m, got ${calcA1.remainingFormatted}`);
assert(calcA1.leavingTimeFormatted === '18:32', `Test A1 - Leaving time: expected 18:32, got ${calcA1.leavingTimeFormatted}`);

// Test A2: Live update simulation at 16:30
const currA2 = 16 * 60 + 30; // 16:30
const calcA2 = calculateSchedule(parseA1.punches, 8, currA2);
assert(calcA2.workedFormatted === '5h 58m', `Test A2 - Live update worked: expected 5h 58m, got ${calcA2.workedFormatted}`);
assert(calcA2.leavingTimeFormatted === '18:32', `Test A2 - Leaving time remains 18:32, got ${calcA2.leavingTimeFormatted}`);

// Test B: Target completed
const inputB = '09:00, 17:10';
const parseB = parsePunchTimes(inputB);
const calcB = calculateSchedule(parseB.punches, 8, 17 * 60 + 10);
assert(calcB.workedFormatted === '8h 10m', `Test B - Worked 8h 10m, got ${calcB.workedFormatted}`);
assert(calcB.isCompleted === true, 'Test B - Target is completed');
assert(calcB.remainingMinutes === 0, 'Test B - Remaining minutes is 0');
assert(calcB.leavingTimeFormatted === null, 'Test B - No future leaving time when target completed');
assert(calcB.targetCompletedText === '8-hour work target completed', 'Test B - Target completed text');

// Test C: Last punch OUT
const inputC = '09:00, 12:00, 13:00, 17:00';
const parseC = parsePunchTimes(inputC);
const calcC = calculateSchedule(parseC.punches, 8, 18 * 60); // Current is 18:00
assert(calcC.isPunchedOut === true, 'Test C - Recognizes last punch is OUT');
assert(calcC.workedFormatted === '7h', `Test C - Worked is exactly 7h, got ${calcC.workedFormatted}`);
assert(calcC.breakFormatted === '1h', `Test C - Break is 1h, got ${calcC.breakFormatted}`);
assert(calcC.remainingFormatted === '1h', `Test C - Remaining is 1h, got ${calcC.remainingFormatted}`);
assert(calcC.leavingTimeFormatted === '19:00', `Test C - Leaving time if resuming now: expected 19:00, got ${calcC.leavingTimeFormatted}`);

// Test D: Invalid input & ordering
const parseEmpty = parsePunchTimes('');
assert(parseEmpty.valid === false && parseEmpty.error.includes('Paste your punch details'), 'Test D1 - Empty input error');

const parseDisordered = parsePunchTimes('09:00, 12:00, 11:00');
assert(parseDisordered.valid === false && parseDisordered.error === 'Punch times must be in chronological order.', 'Test D2 - Disordered punches error');

const parseInvalidTime = parsePunchTimes('25:00');
assert(parseInvalidTime.valid === false && parseInvalidTime.error === 'Could not find valid punch times.', 'Test D3 - Out-of-bounds hour 25:00 rejected');

const parseGibberish = parsePunchTimes('Punch hours: 4.25 without times');
assert(parseGibberish.valid === false && parseGibberish.error === 'Could not find valid punch times.', 'Test D4 - Gibberish rejected');

// Test E: Single active punch
const inputE = '09:00';
const parseE = parsePunchTimes(inputE);
const calcE = calculateSchedule(parseE.punches, 8, 17 * 60);
assert(calcE.workedFormatted === '8h', `Test E - Worked = 8h, got ${calcE.workedFormatted}`);
assert(calcE.isCompleted === true, 'Test E - Completed when single punch hits 8h');

// Test F: Target hours conversions
assert(parseTargetHoursToMinutes(8.5) === 510, 'Test F1 - 8.5h is 510 minutes');
assert(formatTargetDuration(510) === '8h 30m', 'Test F2 - 510m formats to 8h 30m');
assert(parseTargetHoursToMinutes(8.25) === 495, 'Test F3 - 8.25h is 495 minutes');
assert(formatTargetDuration(495) === '8h 15m', 'Test F4 - 495m formats to 8h 15m');
assert(parseTargetHoursToMinutes(7.5) === 450, 'Test F5 - 7.5h is 450 minutes');
assert(formatTargetDuration(450) === '7h 30m', 'Test F6 - 450m formats to 7h 30m');

// Test G: Midnight rollover / Next day
const inputG = '22:00';
const parseG = parsePunchTimes(inputG);
const currG = 23 * 60 + 30; // 23:30 (worked 1h 30m, remaining 6h 30m)
const calcG = calculateSchedule(parseG.punches, 8, currG);
assert(calcG.leavingTimeFormatted === '06:00', `Test G1 - Leaving time next day is 06:00, got ${calcG.leavingTimeFormatted}`);
assert(calcG.isNextDay === true, 'Test G2 - Identifies next day rollover');

// Test H: Alternating format without prefix
const inputH = '9:13, 11:12, 12:01, 12:58, 13:28';
const parseH = parsePunchTimes(inputH);
assert(parseH.valid === true, 'Test H - Plain comma-separated punch times parsed');
const calcH = calculateSchedule(parseH.punches, 8, currA);
assert(calcH.leavingTimeFormatted === '18:32', 'Test H - Same calculation without prefix');

console.log(`\n=== Test Results: ${passedCount} passed, ${failedCount} failed ===`);
if (failedCount > 0) {
  process.exit(1);
}
