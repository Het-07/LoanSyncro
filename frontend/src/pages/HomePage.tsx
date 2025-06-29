"use client";

import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import dashboardImage from "../assets/dashboard.png";
import AppHeader from "../components/layout/AppHeader";
import { BarChart, Bell, ShieldCheck, Zap } from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const features = [
    {
      title: "Track Your Loans",
      description:
        "Easily manage all your loans in one place with our intuitive dashboard",
      icon: BarChart, // Lucide icon component
    },
    {
      title: "Payment Reminders",
      description:
        "Never miss a payment with automatic email and SMS notifications",
      icon: Bell, // Lucide icon component
    },
    {
      title: "Secure Platform",
      description:
        "Your financial data is protected with industry-standard security",
      icon: ShieldCheck, // Lucide icon component
    },
    {
      title: "Fast & Reliable",
      description:
        "Our cloud infrastructure ensures the platform is always available when you need it",
      icon: Zap, // Lucide icon component
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative overflow-hidden">
      {/* Background pattern from auth pages */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-white/[0.03] bg-[length:40px_40px] z-0"></div>

      {/* Navigation */}
      <header className="relative z-10 w-full flex justify-between items-center py-4 px-6 border-b border-gray-800 bg-gray-900/60 backdrop-blur-md">
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">LS</span>
          </div>
          <span className="text-white font-bold text-2xl tracking-tight group-hover:text-accent-400 transition-colors duration-300">
            Loan
            <span className="text-accent-400 group-hover:text-white transition-colors duration-300">
              Syncro
            </span>
          </span>
        </Link>
      </header>

      {/* Hero Section */}
      <div className="flex-grow relative z-10 py-16 md:py-24 animate-fadeIn">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight animate-slideInLeft">
                Simplify Your Loan Management
              </h1>
              <p className="mt-4 text-xl text-gray-300 animate-slideInLeft animation-delay-300">
                Track, manage, and optimize all your loans in one powerful
                platform. Get insights and never miss a payment.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start animate-slideInLeft animation-delay-600">
                <Link to="/register" className="btn btn-primary text-center">
                  Create Free Account
                </Link>
                <Link to="/login" className="btn btn-outline text-center">
                  Sign In
                </Link>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-2xl border border-gray-700 transform hover:scale-105 transition-transform duration-300 animate-fadeIn animation-delay-900">
              <img
                src={dashboardImage || "/placeholder.svg"}
                alt="LoanSyncro Dashboard"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fadeInUp">
            <h2 className="text-3xl font-bold text-white">Powerful Features</h2>
            <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
              Everything you need to take control of your finances and manage
              your loans efficiently.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="card p-6 bg-gray-800/70 backdrop-blur-sm rounded-lg shadow-xl ring-1 ring-gray-700 transform hover:translate-y-[-5px] transition-all duration-300 animate-fadeInUp"
                style={{ animationDelay: `${index * 100 + 200}ms` }}
              >
                <div className="h-12 w-12 rounded-md bg-accent-600/20 text-accent-400 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-950 py-12 relative z-10 animate-fadeIn">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Logo and Copyright */}
            <div className="text-white mb-8 md:mb-0">
              <div className="flex items-center space-x-2 group">
                <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">LS</span>
                </div>
                <span className="text-white font-bold text-2xl tracking-tight group-hover:text-accent-400 transition-colors duration-300">
                  Loan
                  <span className="text-accent-400 group-hover:text-white transition-colors duration-300">
                    Syncro
                  </span>
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-400">
                © {new Date().getFullYear()} LoanSyncro. All rights reserved.
              </p>
            </div>

            {/* CTA Section */}
            <div className="text-center md:text-right">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Ready to simplify your loan management?
              </h2>
              <p className="mt-2 text-gray-300">
                Join thousands of users who have transformed how they manage
                their loans.
              </p>
              <div className="mt-4">
                <Link
                  to="/register"
                  className="btn bg-accent-600 text-white hover:bg-accent-700 hover:shadow-lg px-8"
                >
                  Get Started Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
