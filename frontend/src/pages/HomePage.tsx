import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import dashboardImage from "../assets/dashboard.png";
import AppHeader from "../components/layout/AppHeader";

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
      icon: "chart-bar",
    },
    {
      title: "Payment Reminders",
      description:
        "Never miss a payment with automatic email and SMS notifications",
      icon: "bell",
    },
    {
      title: "Secure Platform",
      description:
        "Your financial data is protected with industry-standard security",
      icon: "shield-alt",
    },
    {
      title: "Fast & Reliable",
      description:
        "Our cloud infrastructure ensures the platform is always available when you need it",
      icon: "bolt",
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <AppHeader />

      {/* Hero Section */}
      <div className="bg-white flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Simplify Your Loan Management
              </h1>
              <p className="mt-4 text-xl text-gray-500">
                Track, manage, and optimize all your loans in one powerful
                platform. Get insights and never miss a payment.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/register" className="btn btn-primary text-center">
                  Create Free Account
                </Link>
                <Link to="/login" className="btn btn-outline text-center">
                  Sign In
                </Link>
              </div>
            </div>
            <div className="rounded-lg overflow-hidden shadow-lg border border-gray-100">
              <img
                src={dashboardImage}
                alt="LoanSyncro Dashboard"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Powerful Features
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Everything you need to take control of your finances and manage
              your loans efficiently.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="card p-6 hover-lift">
                <div className="h-12 w-12 rounded-md bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                  <i className={`fas fa-${feature.icon} text-xl`}></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-primary-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Logo and Copyright */}
            <div className="text-white mb-8 md:mb-0">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <span className="text-primary-600 font-bold text-xl">LS</span>
                </div>
                <span className="ml-2 text-white font-bold text-2xl">
                  Loan<span className="text-white opacity-80">Syncro</span>
                </span>
              </div>
              <p className="mt-3 text-sm text-primary-100">
                © {new Date().getFullYear()} LoanSyncro. All rights reserved.
              </p>
            </div>

            {/* CTA Section */}
            <div className="text-center md:text-right">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Ready to simplify your loan management?
              </h2>
              <p className="mt-2 text-primary-100">
                Join thousands of users who have transformed how they manage
                their loans.
              </p>
              <div className="mt-4">
                <Link
                  to="/register"
                  className="btn bg-white text-primary-700 hover:bg-gray-100 hover:shadow-lg px-8"
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
