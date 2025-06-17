import { Link } from "react-router-dom";

export default function AppHeader() {
  return (
    <header className="relative z-10 w-full flex justify-between items-center py-3 px-6 bg-white border-b border-gray-200">
      <Link to="/" className="flex items-center space-x-2 group">
        <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-xl">LS</span>
        </div>
        <span className="text-gray-900 font-bold text-2xl tracking-tight hover:text-primary-600 transition-colors duration-300">
          Loan
          <span className="text-primary-600 hover:text-gray-900">Syncro</span>
        </span>
      </Link>
    </header>
  );
}
