"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const menuItems = [
    { text: "Dashboard", icon: "chart-line", path: "/dashboard" },
    { text: "My Loans", icon: "university", path: "/loans" },
    { text: "Repayments", icon: "credit-card", path: "/repayments" },
  ];

  const getInitials = () => {
    if (!user || !user.full_name) return "?";
    return user.full_name
      .split(" ")
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getFirstName = () => {
    if (!user || !user.full_name) return "User";
    return user.full_name.split(" ")[0];
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

  return (
    <div className="h-screen bg-gray-900 relative overflow-hidden flex flex-col">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-50"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent"></div>

      {/* Top Navbar */}
      <nav className="relative z-30 glass-effect border-b border-gray-700/50 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo */}
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  LS
                </div>
                <div className="hidden sm:block">
                  <div className="text-xl font-bold text-white">LoanSyncro</div>
                </div>
              </div>
            </div>

            {/* Right side - Navigation and Profile */}
            <div className="flex items-center space-x-8">
              {/* Navigation Items */}
              <div className="hidden md:flex items-center space-x-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.text}
                    to={item.path}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      location.pathname === item.path
                        ? "text-white bg-red-500/20 border border-red-500/30"
                        : "text-gray-300 hover:text-white hover:bg-gray-700/30"
                    }`}
                  >
                    <i className={`fas fa-${item.icon} mr-2`}></i>
                    {item.text}
                  </Link>
                ))}
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() =>
                    setIsProfileDropdownOpen(!isProfileDropdownOpen)
                  }
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/30 transition-all duration-200 group"
                >
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg group-hover:shadow-red-500/25 transition-all duration-200">
                    {getInitials()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-semibold text-gray-200">
                      {getFirstName()}
                    </div>
                    <div className="text-xs text-gray-400">View Profile</div>
                  </div>
                  <i
                    className={`fas fa-chevron-down text-gray-400 transition-transform duration-200 ${
                      isProfileDropdownOpen ? "rotate-180" : ""
                    }`}
                  ></i>
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 glass-effect border border-gray-700/50 rounded-xl shadow-2xl animate-scale-in">
                    <div className="p-4 border-b border-gray-700/50">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm">
                          {getInitials()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-200 truncate">
                            {user?.full_name}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {user?.email}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={logout}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                      >
                        <i className="fas fa-sign-out-alt mr-3"></i>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-700/50">
          <div className="px-4 py-3 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.text}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === item.path
                    ? "text-white bg-red-500/20 border border-red-500/30"
                    : "text-gray-300 hover:text-white hover:bg-gray-700/30"
                }`}
              >
                <i className={`fas fa-${item.icon} mr-3`}></i>
                {item.text}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative z-10 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-fade-in">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
