
import React from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "./Navbar";
import { Navigate } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, requireAuth = false }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 md:px-6">
        {children}
      </main>
      <footer className="bg-secondary py-4 text-center text-sm text-muted-foreground">
        <div className="container mx-auto">
          &copy; {new Date().getFullYear()} MutualFund Portfolio Tracker
        </div>
      </footer>
    </div>
  );
};

export default Layout;
