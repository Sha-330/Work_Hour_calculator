# Work Hours Calculator

A modern, minimal, responsive SaaS-style web application that calculates completed working hours, break durations, remaining work time, and the exact leaving time from attendance punch timestamps.

---

## 1. Project Overview

The **Work Hours Calculator** streamlines daily attendance tracking for employees. Instead of manually computing intervals across multiple check-ins, lunch breaks, and meetings, users simply paste their attendance/punch summary text. The calculator automatically detects the current browser time, parses alternating `IN`/`OUT` timestamps, computes worked and break time, and dynamically determines the exact time the employee can leave to fulfill their daily target.

---

## 2. Features

- **Flexible Punch Text Parsing**: Supports multiple raw formats, including:
  - `Punch Hours:**4.25**Punch Times:9:13, 11:12, 12:01, 12:58, 13:28`
  - `Punch Times: 9:13, 11:12, 12:01, 12:58, 13:28`
  - Comma, space, or newline-separated `09:13, 11:12, ...`
- **Automatic Local Time Detection**: Tracks the user's browser clock in real time with live ticker updates.
- **Alternating IN/OUT Engine**:
  - Calculates completed work sessions.
  - Calculates completed break intervals.
  - Dynamically computes active work time if the last punch is an `IN`.
  - Accurately respects clocked-out states if the last punch is an `OUT`.
- **Configurable Daily Target**: Defaults to `8` hours; accepts fractional hours (e.g. `7.5` = 7h 30m, `8.25` = 8h 15m, `8.5` = 8h 30m).
- **Target Completed State**: Displays `"8-hour work target completed"` and `"You can leave now ✓"` once the target is met, with no future leaving time shown.
- **Comprehensive Validation**:
  - Validates 24-hour time bounds (`00:00–23:59`).
  - Enforces chronological ordering (`Punch times must be in chronological order.`).
  - Provides accessible, readable error alerts without throwing `NaN` or `undefined`.
- **One-Click Copy**: Copies clean summary text to clipboard with fallback support and toast feedback.
- **Visual Intervals Breakdown**: Detailed chronological list of each work session and break interval.
- **Zero Dependencies**: Pure Vanilla HTML5, modern CSS, and modular ES6 JavaScript. Works offline locally in any modern browser.

---

## 3. Calculation Logic

Punch times alternate strictly between check-in and check-out:

```text
Punch 1: IN
Punch 2: OUT
Punch 3: IN
Punch 4: OUT
Punch 5: IN
...
```

### Work Intervals
- Pairs `(0 → 1)`, `(2 → 3)`, ... represent completed work sessions.
- If the last punch is an `IN` punch, the current active interval is `(lastPunch → currentTime)`.
- If the last punch is an `OUT` punch, no active work time is added after the final punch.

### Break Intervals
- Pairs `(1 → 2)`, `(3 → 4)`, ... represent break intervals between clock-outs and subsequent check-ins.

### Example Walkthrough
**Input:** `Punch Times: 9:13, 11:12, 12:01, 12:58, 13:28`  
**Current Time:** `16:18`  
**Target:** `8h 00m` (480 minutes)

- **Work Interval 1:** `09:13 → 11:12` = 1h 59m (119 min)
- **Break Interval 1:** `11:12 → 12:01` = 49m (49 min)
- **Work Interval 2:** `12:01 → 12:58` = 57m (57 min)
- **Break Interval 2:** `12:58 → 13:28` = 30m (30 min)
- **Active Work Interval:** `13:28 → 16:18` = 2h 50m (170 min)

**Totals:**
- **Worked So Far:** `119 + 57 + 170` = **5h 46m** (346 min)
- **Break Time:** `49 + 30` = **1h 19m** (79 min)
- **Remaining Work:** `480 - 346` = **2h 14m** (134 min)
- **Leaving Time:** `16:18 + 2h 14m` = **18:32**

As time progresses while the employee is working (e.g. at `16:30`), worked time automatically increases to `5h 58m` and remaining time becomes `2h 02m`, while leaving time remains constant at `18:32`.

---

## 4. Running Locally

Because the application is built with standard web technologies, no build step or node installation is required.

### Option A: Open directly in browser
Simply double-click `index.html` or open it with any web browser.

### Option B: Local HTTP Server (Recommended)
Using Python:
```bash
# Python 3
python -m http.server 3000
```
Then navigate to:
```
http://localhost:3000
```

Using Node (`npx`):
```bash
npx serve .
```

---

## 5. Testing

### Automated Test Suite
An automated verification suite covering edge cases, target calculations, chronological order validation, and formatting is included in `tests/test_runner.js`.

Run via Node.js:
```bash
node tests/test_runner.js
```

### Manual Testing Scenarios

1. **Scenario A (Standard Active Work):**
   - Punch details: `Punch Hours:**4.25**Punch Times:9:13, 11:12, 12:01, 12:58, 13:28`
   - Use "Simulate / Test Time" and set to `16:18`.
   - Verify:
     - Worked So Far: `5h 46m`
     - Break Time: `1h 19m`
     - Remaining Work: `2h 14m`
     - Leaving Time: `18:32`
2. **Scenario B (Completed Work):**
   - Punch details: `09:00, 17:10`
   - Target: `8`
   - Set test time to `17:10`.
   - Verify:
     - Worked: `8h 10m`
     - Status: `8-hour work target completed`
     - Card: `You can leave now ✓`
3. **Scenario C (Last Punch OUT):**
   - Punch details: `09:00, 12:00, 13:00, 17:00`
   - Current time: `18:00`
   - Verify worked is `7h` (time between `17:00` and `18:00` is NOT counted as working time).
4. **Scenario D (Chronological Validation Error):**
   - Punch details: `09:00, 12:00, 11:00`
   - Verify error message: `Punch times must be in chronological order.`
5. **Scenario E (Clear Button):**
   - Click "Clear".
   - Verify all inputs, metrics, and error states reset to initial defaults.

---

## 6. Project Structure

```text
├── index.html          # Semantic HTML5 layout & accessible components
├── css/
│   └── styles.css      # SaaS design system, responsive grid/flex layout
├── js/
│   ├── parser.js       # Punch string regex extractor & chronological validator
│   ├── calculator.js   # Work/break interval calculator & formatting engine
│   └── app.js          # DOM controller, live clock updates & clipboard handler
├── tests/
│   └── test_runner.js  # Node.js automated test suite
├── .gitignore          # Git hygiene
└── README.md           # Documentation
```
