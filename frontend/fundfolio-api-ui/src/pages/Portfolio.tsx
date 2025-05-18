import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { portfolioAPI } from "../services/api"; // Make sure this is properly configured
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface PortfolioItem {
  fund_name: string;
  units: number;
  current_price?: number;
  current_value?: number;
}

interface PortfolioData {
  portfolios: PortfolioItem[];
  total_investment: number;
  total_current_value: number;
  total_profit_loss: number;
}

const Portfolio: React.FC = () => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Optional: show errors
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!localStorage.getItem("access_token")) return;

      try {
        debugger;
        setIsLoading(true);
        setError(null);
        const response = await portfolioAPI.getPortfolio(localStorage.getItem("access_token"));
        console.log("Response:", response);

        // Assuming the API response directly returns the portfolio data
        setPortfolioData(response);
      } catch (err: any) {
        debugger;
        console.error("Error fetching portfolio:", err);
        setError("Failed to load portfolio. Please try again later.");
        setPortfolioData(null);
      } finally {
        debugger;
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, [!localStorage.getItem("access_token")]);

  const getTotalValue = () => {
    return portfolioData?.portfolios.reduce((total, item) => total + (item.current_value || 0), 0) || 0;
  };

  return (
    <Layout requireAuth>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Your Portfolio</h1>

        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <Card className="bg-destructive/10 text-destructive p-4">
            <p>{error}</p>
          </Card>
        ) : portfolioData?.portfolios.length > 0 ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{getTotalValue().toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total portfolio value across {portfolioData.portfolios.length} funds
                </p>

                {portfolioData.total_investment !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    Total Investment: ₹{portfolioData.total_investment?.toLocaleString()}
                  </p>
                )}

                {portfolioData.total_current_value !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    Current Value: ₹{portfolioData.total_current_value?.toLocaleString()}
                  </p>
                )}

                {portfolioData.total_profit_loss !== undefined && (
                  <p className="text-sm text-muted-foreground">
                    Profit/Loss: ₹{portfolioData.total_profit_loss?.toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              {portfolioData.portfolios.map((item, index) => (
                <Card key={index} className="portfolio-card">
                  <div className="flex flex-col sm:flex-row justify-between p-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        {item.fund_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {item.units.toFixed(1)} units
                      </p>
                    </div>
                    <div className="mt-4 sm:mt-0 text-right">
                      <div className="font-semibold">
                        ₹{item.current_value?.toLocaleString() || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Price: ₹{item.current_price?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <h3 className="text-lg font-semibold">No funds in your portfolio</h3>
            <p className="mt-2 text-muted-foreground">
              Start by adding some funds to your portfolio.
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <Button onClick={() => navigate("/funds")}>Browse Funds</Button>
              <Button variant="outline" onClick={() => navigate("/portfolio/add")}>
                Add Manually
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Portfolio;