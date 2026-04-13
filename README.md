# 🛒 ApnaCart Mobile - Hyper-Local Food & Grocery Delivery

[![Capacitor](https://img.shields.io/badge/Capacitor-1185ca?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![React](https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61dafb)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38b2ac?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**ApnaCart Mobile** is a premium, high-performance mobile application designed for seamless hyper-local food and grocery delivery. Built with a modern tech stack focused on speed, reliability, and a world-class user experience.

---

## ✨ Key Features

- **🚀 Real-time Merchant Discovery**: Find the best local merchants, restaurants, and grocery stores in your vicinity with optimized performance.
- **🛡️ Secure Auth & Profiles**: Effortless onboarding using Firebase Authentication for secure and persistent user sessions.
- **💳 Seamless Payments**: Integrated with **Stripe** for high-security, lightning-fast payment processing.
- **🔔 Live Order Tracking**: Real-time push notifications and order status updates via Firebase Cloud Messaging.
- **🛒 Dynamic Cart Management**: Intuitive cart experience with real-time price calculations and local state management.
- **🎨 Premium UI/UX**: Crafted with Tailwind CSS for a modern, responsive, and glassmorphic aesthetic.

---

## 🛠️ Tech Stack

### Frontend & Core
- **Vite + React**: For the fastest developer experience and optimized production bundles.
- **Capacitor JS**: Native bridge to deploy seamlessly on Android and iOS.
- **Context API**: Efficient state management for Carts and Sidebar interactions.

### Backend & Infrastructure
- **Firebase**: Powering Analytics, Authentication, and Cloud Messaging.
- **Stripe API**: Handling global-standard secure payments.
- **Laravel Backend (API)**: Connected to a robust PHP/Laravel enterprise ecosystem.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Android Studio (for Android builds)
- Xcode (for iOS builds)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vipultikhe234/ApnaCart-Mobile.git
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file in the root and add your configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_STRIPE_PUBLIC_KEY=your_key
   VITE_API_BASE_URL=https://your-api.com/api
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Mobile**
   ```bash
   npm run build
   npx cap sync
   npx cap open android # or ios
   ```

---

## 📱 Screenshots

| Home Screen | Merchant Detail | Payment Flow |
| :---: | :---: | :---: |
| ![Home](https://via.placeholder.com/300x500?text=Home+Screen) | ![Merchant](https://via.placeholder.com/300x500?text=Merchant+Detail) | ![Payment](https://via.placeholder.com/300x500?text=Checkout) |

---

## 📜 License
This project is proprietary. All rights reserved.

Created with ❤️ by [Vipul Tikhe](https://github.com/vipultikhe234)
