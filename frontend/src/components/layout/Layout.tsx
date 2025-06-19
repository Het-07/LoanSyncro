"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

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

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-50"></div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent"></div>

      {/* Sidebar for desktop */}
      <div
        className={`hidden md:fixed md:inset-y-0 md:flex md:flex-col transition-all duration-300 z-30 ${
          isCollapsed ? "md:w-20" : "md:w-72"
        }`}
      >
        <div className="flex flex-col flex-grow glass-effect border-r border-gray-700/50 overflow-hidden">
          {/* Logo and collapse button */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <div
              className={`flex items-center transition-all duration-300 ${
                isCollapsed ? "justify-center" : ""
              }`}
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                LS
              </div>
              {!isCollapsed && (
                <div className="ml-3 animate-fade-in">
                  <div className="text-xl font-bold text-white">LoanSyncro</div>
                  <div className="text-xs text-gray-400">Loan Management</div>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all duration-200"
            >
              <i
                className={`fas ${
                  isCollapsed ? "fa-chevron-right" : "fa-chevron-left"
                }`}
              ></i>
            </button>
          </div>

          {/* User info */}
          {!isCollapsed && (
            <div className="p-6 border-b border-gray-700/50 animate-fade-in">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                  {getInitials()}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    Welcome back, {getFirstName()}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item, index) => (
              <Link
                key={item.text}
                to={item.path}
                className={`sidebar-item ${
                  location.pathname === item.path ? "active" : ""
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <i
                  className={`fas fa-${item.icon} ${
                    isCollapsed ? "text-lg" : "mr-3"
                  } transition-all duration-200 group-hover:scale-110`}
                ></i>
                {!isCollapsed && (
                  <span className="font-medium transition-all duration-200">
                    {item.text}
                  </span>
                )}
                {location.pathname === item.path && !isCollapsed && (
                  <div className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </Link>
            ))}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t border-gray-700/50">
            <button
              onClick={logout}
              className="sidebar-item w-full hover:bg-red-500/10 hover:text-red-400"
            >
              <i
                className={`fas fa-sign-out-alt ${
                  isCollapsed ? "text-lg" : "mr-3"
                } transition-all duration-200`}
              ></i>
              {!isCollapsed && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-40 glass-effect border-b border-gray-700/50">
        <div className="flex items-center justify-between p-4">
          <button
            type="button"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-all duration-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <i className="fas fa-bars text-xl"></i>
          </button>

          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm mr-2">
              LS
            </div>
            <span className="text-lg font-bold text-white">LoanSyncro</span>
          </div>

          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-xs">
              {getInitials()}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 flex z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full glass-effect animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                  LS
                </div>
                <div className="ml-3">
                  <div className="text-xl font-bold text-white">LoanSyncro</div>
                  <div className="text-xs text-gray-400">Loan Management</div>
                </div>
              </div>
              <button
                type="button"
                className="p-2 rounded-lg text-gray-400 hover:text-white transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-semibold text-sm">
                  {getInitials()}
                </div>
                <div className="ml-3">
                  <div className="text-sm font-semibold text-white">
                    Welcome back, {getFirstName()}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.text}
                  to={item.path}
                  className={`sidebar-item ${
                    location.pathname === item.path ? "active" : ""
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className={`fas fa-${item.icon} mr-3`}></i>
                  <span className="font-medium">{item.text}</span>
                  {location.pathname === item.path && (
                    <div className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  )}
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-700/50">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="sidebar-item w-full hover:bg-red-500/10 hover:text-red-400"
              >
                <i className="fas fa-sign-out-alt mr-3"></i>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main
        className={`transition-all duration-300 relative z-10 ${
          isCollapsed ? "md:pl-20" : "md:pl-72"
        }`}
      >
        <div className="min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-fade-in">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
