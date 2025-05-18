import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI, Token, UserCreate, UserOut } from "../services/api";
import { toast } from "sonner";

interface AuthState {
  token: string | null;
  user: UserOut | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: UserCreate) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Load token from localStorage on initial load
  useEffect(() => {
    const loadStoredAuth = () => {
      try {
        const storedToken = localStorage.getItem("access_token");
        const storedUser = localStorage.getItem("user");
        
        if (storedToken && storedUser) {
          setState({
            token: storedToken,
            user: JSON.parse(storedUser),
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Failed to load auth state:", error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    loadStoredAuth();
  }, []);

  const login = async (credentials: UserCreate) => {
    try {
      const response = await authAPI.login(credentials);
      
      // User data isn't returned from login endpoint, so construct minimal user object
      const userObj: UserOut = {
        id: 0, // We don't have the ID from the login response
        email: credentials.email,
      };
      
      // Store auth data
      localStorage.setItem("token", response.access_token);
      localStorage.setItem("user", JSON.stringify(userObj));
      
      setState({
        token: response.access_token,
        user: userObj,
        isAuthenticated: true,
        isLoading: false,
      });
      
      toast.success("Login successful!");
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed. Please check your credentials.");
      throw error;
    }
  };

  const register = async (userData: UserCreate): Promise<void> => {
    try {
      await authAPI.register(userData);
      toast.success("Registration successful! You can now log in.");
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Registration failed. Please try again.");
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    
    setState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    toast.info("You have been logged out");
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
