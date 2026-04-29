# ⚡ Code Review AI

An AI-powered code review assistant built with React and Google Gemini. Paste your code, get instant structured feedback with severity ratings, quality metrics, and actionable suggestions.

## ✨ Features

- 🔍 **AI-Powered Analysis** — Uses Google Gemini to review your code in seconds
- 🚨 **Severity Ratings** — Issues categorized as Critical, Warning, or Info
- 📊 **Quality Metrics** — Visual scores for Security, Performance, Readability, and Best Practices
- 🌐 **8 Languages** — JavaScript, TypeScript, Python, Java, C++, Go, Rust, C#
- 🎯 **Review Types** — Full Review, Security, Performance, Style & Readability, Logic Bugs
- 🎨 **Dark UI** — Clean, modern dark-themed dashboard

## 🛠️ Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **AI:** Google Gemini 2.0 Flash (free tier)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A free [Google Gemini API key](https://aistudio.google.com)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/code-review-ai.git
cd code-review-ai
```

**2. Install frontend dependencies**
```bash
npm install
```

**3. Install backend dependencies**
```bash
cd server
npm install
cd ..
```

**4. Add your Gemini API key**

Open `server/index.js` and replace the placeholder:
```javascript
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
```

### Running the App

You need **two terminals** running at the same time:

**Terminal 1 — Frontend:**
```bash
npm run dev
```

**Terminal 2 — Backend:**
```bash
cd server
node index.js
```

Then open your browser at **http://localhost:5173**

## 📁 Project Structure

```
code-review-ai/
├── src/
│   └── App.jsx          # Main React component
├── server/
│   ├── index.js         # Express backend / API proxy
│   └── package.json
├── public/
├── package.json
└── README.md
```

## 🔑 Getting a Free Gemini API Key

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Click **"Get API Key"** → **"Create API key"**
4. Copy and paste it into `server/index.js`

No credit card required.

## 🖥️ Usage

1. Open the app at `http://localhost:5173`
2. Select your **language** and **review type** from the left panel
3. Paste your code in the **Editor** tab
4. Click **▶ Run Review**
5. View findings in the **Results** tab and scores in the **Metrics** tab

## ⚠️ Known Issues

- The parser is optimized for Gemini's response format — results may vary with very short code snippets
- Large files (2000+ lines) may produce incomplete reviews due to token limits

---

Built using React, Express, and Google Gemini
