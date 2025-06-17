import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Logo from "./Logo";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { text: "Dashboard", icon: "chart-line", path: "/dashboard" },
    { text: "My Loans", icon: "money-bill-wave", path: "/loans" },
    { text: "Repayments", icon: "credit-card", path: "/repayments" },
  ];

  const getInitials = () => {
    if (!user || !user.full_name) return "?";
    return user.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow border-r border-gray-200 bg-white overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-6 py-6 bg-primary-700 text-white">
            <Logo size="md" />
          </div>
          <div className="mt-2 flex-1 flex flex-col">
            <div className="px-4 py-2">
              {user && (
                <div className="flex items-center py-2 px-1">
                  <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
                    {getInitials()}
                  </div>
                  <div className="ml-3">
                    <p className="text-lg font-medium text-gray-800">
                      {user.full_name}
                    </p>
                    <p className="text-lg text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <nav className="flex-1 px-4 pb-4 space-y-2 mt-4">
              {menuItems.map((item) => (
                <Link
                  key={item.text}
                  to={item.path}
                  className={`${
                    location.pathname === item.path
                      ? "nav-link-active"
                      : "nav-link-inactive"
                  } nav-link`}
                >
                  <i
                    className={`fas fa-${item.icon} mr-3 ${
                      location.pathname === item.path
                        ? "text-primary-600"
                        : "text-gray-400"
                    } flex-shrink-0 h-5 w-5`}
                    aria-hidden="true"
                  ></i>
                  {item.text}
                </Link>
              ))}
            </nav>
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={logout}
                className="nav-link nav-link-inactive w-full hover:bg-red-50 hover:text-red-600 group"
              >
                <i
                  className="fas fa-sign-out-alt mr-3 text-gray-400 group-hover:text-red-500 flex-shrink-0 h-5 w-5"
                  aria-hidden="true"
                ></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 flex-shrink-0 flex bg-white shadow-sm md:hidden">
          <button
            type="button"
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="sr-only">Open sidebar</span>
            <i className="fas fa-bars h-6 w-6" aria-hidden="true"></i>
          </button>
          <div className="flex-1 flex items-center justify-between px-4">
            <div className="flex-1 flex">
              <h2 className="text-lg font-bold text-gray-900">
                {menuItems.find((item) => item.path === location.pathname)
                  ?.text || "LoanSyncro"}
              </h2>
            </div>
            <div>
              <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-sm">
                  {getInitials()}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile sidebar */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 flex z-40 md:hidden">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setIsMobileMenuOpen(false)}
            ></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="flex items-center justify-between flex-shrink-0 px-4 py-5 bg-primary-700 text-white">
                <Logo size="sm" />
                <button
                  className="rounded-md text-primary-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <i className="fas fa-times h-6 w-6" aria-hidden="true"></i>
                </button>
              </div>
              <div className="mt-5 flex-1 h-0 overflow-y-auto">
                <nav className="px-2 space-y-1">
                  {menuItems.map((item) => (
                    <Link
                      key={item.text}
                      to={item.path}
                      className={`${
                        location.pathname === item.path
                          ? "nav-link-active"
                          : "nav-link-inactive"
                      } nav-link`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <i
                        className={`fas fa-${item.icon} mr-3 ${
                          location.pathname === item.path
                            ? "text-primary-600"
                            : "text-gray-400"
                        } flex-shrink-0 h-5 w-5`}
                        aria-hidden="true"
                      ></i>
                      {item.text}
                    </Link>
                  ))}
                </nav>
                <div className="border-t border-gray-200 p-4 mt-auto">
                  <button
                    onClick={logout}
                    className="nav-link nav-link-inactive w-full hover:bg-red-50 hover:text-red-600 group"
                  >
                    <i
                      className="fas fa-sign-out-alt mr-3 text-gray-400 group-hover:text-red-500 flex-shrink-0 h-5 w-5"
                      aria-hidden="true"
                    ></i>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
