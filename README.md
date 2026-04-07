# 🚀 BachelorBudget — Smart Finance for Bachelors

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-DB%20%26%20Auth-blueviolet?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Framer Motion](https://img.shields.io/badge/Framer--Motion-Animation-FF004F?style=for-the-badge&logo=framer)](https://www.framer.com/motion/)
[![Gemini AI](https://img.shields.io/badge/Gemini--AI-Advisor-4285F4?style=for-the-badge&logo=google-gemini)](https://deepmind.google/technologies/gemini/)

> **Track every rupee. Live better.**  
> A cinematic, high-fidelity finance tracker designed for students and bachelors. Featuring AI-powered insights, dynamic carry-forward reserves, and a premium "Luminary Neon" design system.

---

## 📺 Live Demo

🔗 **[https://bachelorbudget.vercel.app/](https://bachelorbudget.vercel.app/)**

---

## ✨ Key Features

### 🌌 Cinematic "Luminary Neon" UI
A premium dark-mode aesthetic built with **Glassmorphism**, fluid **Framer Motion** transitions, and neon ambient glows. Designed to feel like a high-end ritual, not a chore.

### 🤖 AI Financial Advisor
Powered by **Google Gemini AI**. Get real-time advice on your spending habits, budget adjustments, and long-term financial health directly from your dashboard.

### 📅 Daily Reserve Carry-Forward
The ultimate bachelor feature. Your daily budget automatically calculates remaining "reserves" that carry forward to the next day, rewards you for saving, and adjusts in real-time as you spend.

### 🛡️ Secure Authentication
- **Google OAuth**: Fast, one-click access.
- **Email/Password**: Traditional secure login.
- **Supabase RLS**: Your data is yours alone, protected by Row-Level Security.

### 📊 Intelligence Dashboard
- **Category Breakdown**: High-fidelity animated bars showing exactly where your money goes.
- **Dynamic Progress**: Real-time budget tracking with neon gradient visuals.
- **Filter Flyouts**: Quick-access category filters for deep expense analysis.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14 (App Router)](https://nextjs.org/)
- **Database / Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & Vanilla CSS
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **AI Engine**: [Google Generative AI (Gemini)](https://ai.google.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/SNEHANGSHU2510/bachelorbudget.git
cd bachelorbudget
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📂 Project Structure

```text
├── app/                  # Next.js App Router
│   ├── auth/             # Login & Sign-up pages
│   ├── dashboard/        # Main platform (Stats, Expenses, Overview)
│   └── layout.tsx        # Global design tokens
├── components/           # Reusable UI & Business Logic Components
│   ├── ui/               # Primary design system components
│   ├── expenses/         # Expense list & filters
│   └── charts/           # High-fidelity visual data
├── lib/                  # Store (Zustand), database clients, & utilities
└── public/               # Static assets & icons
```

---

## 🛡️ Authentication Configuration

### Google OAuth Setup
To enable Google Sign-In:
1. Go to **Google Cloud Console** and create a project.
2. Setup **OAuth Consent Screen** (External).
3. Create **Credentials → OAuth Client ID** (Web Application).
4. Add your **Authorized Redirect URI**:
   `https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback`
5. Copy keys into **Supabase Dashboard → Authentication → Providers → Google**.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing
Contributions are welcome! Feel free to open an Issue or PR.

---

**Built with ❤️ for the bachelor lifestyle.**
