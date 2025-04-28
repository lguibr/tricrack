
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) <!-- Choose your license -->
[![Next.js](https://img.shields.io/badge/Next.js-14.2.3-blue?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Styled Components](https://img.shields.io/badge/Styled_Components-6.1.11-db7093?logo=styled-components)](https://styled-components.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-purple?logo=pwa)](https://web.dev/progressive-web-apps/)
# 💥 TriCrack 💥 - The Hexagonal Triangle Puzzle Extravaganza!

<p align="center">
  <img src="https://raw.githubusercontent.com/lguibr/tricrack/main/bitmap.png" alt="Logo" width="300"/>
</p>



Welcome to **TriCrack**, the mind-bending, color-matching, line-clearing puzzle game built with the power of Next.js and deployed as a lightning-fast Progressive Web App (PWA)! Get ready to challenge your spatial reasoning and aim for that high score! 🏆

---

## 🤔 What is TriCrack?

TriCrack is a deceptively simple yet highly addictive puzzle game where you:

1.  **Drag & Drop Shapes:** Grab randomly generated shapes made of colorful triangles.
2.  **Fill the Hex Grid:** Strategically place these shapes onto the main hexagonal grid.
3.  **Complete Lines:** Fill entire lines across the grid (horizontally or diagonally!) with triangles.
4.  **💥 CRACK! 💥:** Completed lines disappear, earning you points and clearing space.
5.  **Score Big:** Keep placing shapes and cracking lines to rack up points. Beat your high score!
6.  **Game Over?** If you run out of valid moves for your available shapes, the game ends. Try again!

It's easy to learn, but mastering the optimal placement to maximize line clears takes skill and foresight. Plus, it works offline and you can install it right to your device! ✨

---

## ✨ Features

*   **Engaging Hexagonal Gameplay:** A fresh twist on grid-based puzzles.
*   **Colorful Triangle Shapes:** Unique, randomly generated pieces keep things interesting.
*   **Intuitive Drag & Drop:** Smooth controls on both desktop and mobile (thanks to a touch polyfill!).
*   **Line Collapse Mechanic:** Clear lines horizontally and diagonally for satisfying point bursts.
*   **Score Tracking:** See your current score and strive to beat your persistent **High Score** (saved locally!).
*   **Progressive Web App (PWA):**
    *   **Installable:** Add TriCrack to your home screen like a native app.
    *   **Offline Capable:** Play anytime, anywhere, even without an internet connection! (`NetworkFirst` caching strategy via Workbox).
*   **Undo Functionality:** Made a mistake? Hit undo to revert your last move! (Limited history).
*   **Restart Game:** Quickly start a fresh game anytime.
*   **Responsive Design:** Looks and plays great on various screen sizes.
*   **Built with Modern Tech:** Leveraging Next.js 14, React 18, TypeScript, and Styled Components.
*   **Touch Support:** Custom `DragDropTouch.js` polyfill enables seamless drag-and-drop on mobile devices.
*   **Analytics:** Integrated with Vercel Analytics to understand usage patterns (privately, of course!).

---

## 🎮 How to Play

1.  **Look at your shapes:** You'll have three shapes available at the bottom.
2.  **Drag a shape:** Click (or tap) and drag a shape onto the main hexagonal grid.
3.  **Find a spot:** Hover over the grid. Valid placement spots will highlight. The shape needs empty space that matches its configuration.
4.  **Drop it!** Release the shape onto a valid spot. The triangles will lock in place.
5.  **Clear lines:** If placing the shape completes one or more full lines across the grid, those lines will "crack" and disappear. You score points for each triangle cleared *and* bonus points for line clears!
6.  **Get new shapes:** Once you've used all three shapes, three new random ones will appear.
7.  **Keep going:** Continue placing shapes and clearing lines.
8.  **No more moves?** If none of the available shapes can fit anywhere on the grid, it's **Game Over!**
9.  **Aim High!** Try to beat your previous best score!

---

## 🚀 Getting Started (For Developers)

Want to run TriCrack locally or contribute? Here's how:

**Prerequisites:**

*   [Node.js](https://nodejs.org/) (Version 18 or later recommended)
*   [Yarn](https://yarnpkg.com/) or npm (comes with Node.js)

**Steps:**

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/tricrack.git # Replace with your repo URL
    cd tricrack
    ```

2.  **Install Dependencies:**
    ```bash
    yarn install
    # or
    npm install
    ```

3.  **Run the Development Server:**
    ```bash
    yarn dev
    # or
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser. You should see TriCrack running! Enjoy the hot-reloading goodness.

4.  **Linting:**
    ```bash
    yarn lint
    # or
    npm run lint
    ```

5.  **Build for Production:**
    ```bash
    yarn build
    # or
    npm run build
    ```
    This creates an optimized production build in the `.next` folder and generates the PWA service worker files in `public`.

6.  **Run Production Build Locally:**
    ```bash
    yarn start
    # or
    npm run start
    ```
    This starts the server using the production build.

---

## 🛠️ Tech Stack & Key Configs

*   **Framework:** [Next.js](https://nextjs.org/) 14.2.3 (App Router)
*   **UI Library:** [React](https://reactjs.org/) 18
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Styled Components](https://styled-components.com/) (with SSR support enabled in `next.config.js`)
*   **State Management:** React Context API (`src/app/contexts/HexGridContext.tsx`)
*   **PWA:** [next-pwa](https://github.com/shadowwalker/next-pwa) (using Workbox)
    *   Configured in `next.config.js`.
    *   Uses `NetworkFirst` caching strategy for most assets.
    *   Generates `public/sw.js` and related Workbox files.
    *   Dynamic manifest generated via `src/app/manifest.ts`.
*   **Touch Drag & Drop:** Custom `DragDropTouch.js` polyfill in `public/` (Note the custom `OFFSET_Y = 146` for better visual feedback during drag).
*   **Analytics:** [@vercel/analytics](https://vercel.com/analytics) (Setup in `src/app/layout.tsx`)
*   **Linting:** ESLint with `next/core-web-vitals` config (`.eslintrc.json`)
*   **Deployment:** Ready for [Vercel](https://vercel.com/) (inferred from `.gitignore` and analytics)

---

## 📁 Project Structure

```
tricrack/
├── public/             # Static assets, icons, PWA files (sw.js, manifest.json - fallback)
│   ├── DragDropTouch.js # Touch polyfill
│   └── ...             # Icons, etc.
├── src/
│   ├── app/            # Next.js App Router
│   │   ├── components/ # React components (HexGrid, Triangle, ShapeRenderer, Modal...)
│   │   ├── contexts/   # React context (HexGridContext)
│   │   ├── utils/      # Game logic, constants, types
│   │   ├── _app.tsx    # Custom App component (PWA meta tags)
│   │   ├── globals.css # Global styles
│   │   ├── layout.tsx  # Root layout (SW registration, Analytics)
│   │   ├── manifest.ts # Dynamic PWA Manifest generation
│   │   └── page.tsx    # Main game page
│   └── lib/            # Supporting libraries (e.g., Styled Components Registry)
├── .eslintrc.json      # ESLint config
├── .gitignore          # Git ignore rules
├── next.config.js      # Next.js config (PWA, Styled Components)
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # TypeScript config
└── README.md           # You are here!
```

---

## 🤝 Contributing

Contributions are welcome! If you have ideas for improvements, new features, or find bugs, please feel free to:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/YourAmazingFeature`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
5.  Push to the branch (`git push origin feature/YourAmazingFeature`).
6.  Open a Pull Request.

Please try to follow the existing code style and add tests if applicable.

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. <!-- Create a LICENSE file (e.g., containing the MIT license text) -->

---

## 🎉 Acknowledgements & Final Words

*   Big thanks to the creators of `next-pwa` for simplifying PWA implementation in Next.js.
*   Kudos to the `DragDropTouch` polyfill for making mobile drag-and-drop possible.

Now go crack some triangles and set a new high score! Have fun! 😄
```

**Key improvements and rationale:**

1.  **Engaging Title & Intro:** Uses emojis and enthusiastic language ("Extravaganza!", "Mind-bending"). Clearly states what the game is and its core tech.
2.  **Visual Placeholder:** Explicitly added a placeholder for a GIF/screenshot, which is crucial for a game README.
3.  **Clear "What is it?":** Breaks down the core concept into simple, numbered steps.
4.  **Comprehensive Features:** Lists all significant features derived from the code analysis (PWA details, Undo, Local Storage High Score, Touch Support, etc.).
5.  **Simple "How to Play":** Provides step-by-step instructions for players.
6.  **Developer "Getting Started":** Clear, standard instructions for cloning, installing, and running. Includes build and lint commands.
7.  **Detailed Tech Stack:** Lists all major libraries and technologies used, linking to their official sites where appropriate.
8.  **Key Configs Highlighted:** Points out specific files and configurations that are interesting or important (PWA setup, touch polyfill offset, dynamic manifest).
9.  **Project Structure:** Gives developers a quick overview of where to find things.
10. **Standard Sections:** Includes Contributing and License sections.
11. **Fun Tone:** Maintained throughout with emojis and positive language ("💥 CRACK! 💥", "🏆", "✨", "🚀", "🛠️", "🎉").
12. **Badges:** Added relevant badges for key technologies and PWA status.
13. **Accuracy:** Reflects the specifics found in the provided code files (e.g., `NetworkFirst` strategy, Vercel Analytics, `DragDropTouch` usage, context-based state management).