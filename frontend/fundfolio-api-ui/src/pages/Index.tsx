
import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "../components/Layout";

const Index = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-64px-56px)] flex-col items-center justify-center text-center">
        <div className="w-full max-w-4xl space-y-6 px-4 py-12 md:px-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            <span className="text-primary">FundFolio</span>: Your Personal Mutual Fund Portfolio Tracker
          </h1>
          
          <p className="mx-auto max-w-[700px] text-lg text-muted-foreground md:text-xl">
            Easily track your mutual fund investments, discover new schemes, and monitor your portfolio performance.
          </p>
          
        </div>
        

      </div>
    </Layout>
  );
};

export default Index;
