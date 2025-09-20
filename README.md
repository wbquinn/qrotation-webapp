# QRotation: A Volleyball Rotation Tracker

A single-page web application to track player rotations, score, and set history during a volleyball game. The page has metadata to enable it to be used as a full screen Web Application in iOS or Android, by adding to the home screen.

This repository includes the application and a full suite of automated tests using [Playwright](https://playwright.dev/).

## Features

-   **Roster Management**: Add and edit players with their number and role.
-   **Starting Lineup**: Assign players to starting positions (I-VI).
-   **Active Set View**: A clear 3x2 grid showing the on-court rotation.
-   **Automated Rotation**: The app correctly rotates players on a side-out point.
-   **Score Tracking**: Easily track points for both teams.
-   **Set History**: Completed sets are logged with their score and start/end times.
-   **Persistent State**: Your roster, active game, and history are saved in local storage.

---

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher recommended)
-   npm (comes with Node.js)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd volleyball-tracker
    ```

2.  **Install dependencies:**
    This will install Playwright and the `http-server` needed to run the tests.
    ```bash
    npm install
    npm install -g http-server
    ```

3.  **Install Playwright browsers:**
    ```bash
    npx playwright install
    ```

---

## 🧪 Running the Tests

The test suite covers all major user stories, from adding players to scoring, rotating, and viewing history.

1.  **Run all tests:**
    This command will start a local web server and run the Playwright tests in a headless browser.
    ```bash
    npm test
    ```

2.  **Run tests with the UI Mode:**
    For a better debugging experience, use Playwright's UI mode.
    ```bash
    npm run test:ui
    ```

3.  **View the HTML report:**
    After running the tests, a detailed report is generated in the `playwright-report` folder.
    ```bash
    npm run report
    ```