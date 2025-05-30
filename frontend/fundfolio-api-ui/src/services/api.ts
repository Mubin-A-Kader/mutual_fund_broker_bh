import { toast } from "sonner";
import axios from "axios";

// Set the base URL for API requests
const API_URL = "http://0.0.0.0:8000";

// Types
export interface UserCreate {
  email: string;
  password: string;
}

export interface UserOut {
  id: number;
  email: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface FundSchema {
  fund_house: string;
  scheme_name: string;
  nav: number;
}

export interface PortfolioItem {
  fund_name: string;
  units: number;
}

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  method: string = "GET",
  data?: any,
  token?: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  // Build query string from params
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, String(value));
    }
  });
  
  // Build URL with query params
  const url = `${API_URL}${endpoint}${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    ...(data && { body: JSON.stringify(data) }),
  };

  // Add token to Authorization header if provided
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Error ${response.status}: ${response.statusText}`
      );
    }
    
    // Handle empty responses
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    
    return {} as T;
  } catch (error) {
    console.error("API error:", error);
    toast.error(error instanceof Error ? error.message : "An error occurred");
    throw error;
  }
}

// Auth API functions
export const authAPI = {
  register: (userData: UserCreate) => 
    apiCall<UserOut>("/auth/register", "POST", userData),
    
  login: (userData: UserCreate) => 
    apiCall<Token>("/auth/login", "POST", userData),
};

export const fundsAPI = {
  getSchemes: async (family: string, page: number, token: string, search: string = "") => {
    const params: any = { page };
    if (search && search.length >= 3) params.search = search;
    const response = await axios.get(
      `http://127.0.0.1:8000/funds/schemes/${encodeURIComponent(family)}`,
      {
        params,
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },
};

// Portfolio API functions
export const portfolioAPI = {
  getPortfolio: (token: string) => 
    apiCall<any>("/portfolio/", "GET", undefined, token),
    
  addToPortfolio: (token: string, portfolioItem: PortfolioItem) => 
    apiCall<any>("/portfolio/", "POST", portfolioItem, token),
};
