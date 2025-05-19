
import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { fundsAPI } from "../services/api";  // Remove FundSchema from here since we define it below
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import DataTable from 'react-data-table-component';

interface FundSchema {
  Scheme_Name: string;
  AMC_Code: string;
  Fund_House: string;
  NAV: number;
}

const Funds: React.FC = () => {
  const [fundHouses, setFundHouses] = useState<string[]>([]);
  const [selectedFundHouse, setSelectedFundHouse] = useState<string>("");
  const [funds, setFunds] = useState<FundSchema[]>([]);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Fetch fund houses on component mount
  useEffect(() => {
    const fetchFundHouses = async () => {
      setIsLoading(true);
      try {
        const response = await fundsAPI.getSchemes("CAMS",1,localStorage.getItem("access_token"));
        console.log(response,"iiiiii");
        setFundHouses(response.data);
        setTotalRows(response.pagination.total_items);
        if (response.data.length > 0) {
          setSelectedFundHouse(response.data[0].Scheme_Name);
        }
      } catch (error) {
        console.error("Error fetching fund houses:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFundHouses();
  }, []);

  // Fetch funds when selected fund house or page changes
  useEffect(() => {
    const fetchFunds = async () => {
      if (!selectedFundHouse) return;
      
      setIsLoading(true);
      try {
        const accessToken = localStorage.getItem("access_token");
        const response = await fundsAPI.getSchemes(selectedFundHouse, page, accessToken);
        if (response && response.data) {
          setFunds(response.data);
          // Update pagination state based on response
          if (response.pagination) {
            setTotalRows(response.pagination.total_items || 0);
            setPage(response.pagination.current_page || 1);
          }
        } else {
          setFunds([]);
          setTotalRows(0);
        }
      } catch (error) {
        console.error("Error fetching funds:", error);
        setFunds([]);
        setTotalRows(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFunds();
  }, [selectedFundHouse, page]);

  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handlePerRowsChange = async (newPerPage: number, page: number) => {
    setPerPage(newPerPage);
    setPage(page);
  };

  const filteredFunds = funds.filter(fund =>
    fund.Scheme_Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToPortfolio = (fund: FundSchema) => {
    navigate("/portfolio/add", { state: { fundName: fund.Scheme_Name } });
  };

  // Remove duplicate declarations of handlePageChange and handlePerRowsChange here

  const columns = [
    {
      name: 'Fund House',
      selector: (row: FundSchema) => row.Scheme_Name || '',
      sortable: true,
    },
    {
      name: 'Minimum Amount',
      selector: (row: FundSchema) => row.NAV || 0,
      sortable: true,
      format: (row: FundSchema) => `₹${(row.NAV || 0).toLocaleString('en-IN')}`,
    },
  ];

  const customStyles = {
    rows: {
      style: {
        minHeight: '52px',
        '&:hover': {
          backgroundColor: 'var(--muted)',
          cursor: 'pointer',
        },
      },
    },
    headRow: {
      style: {
        backgroundColor: 'var(--muted)',
        borderBottom: '1px solid var(--border)',
      },
    },
    pagination: {
      style: {
        borderTop: '1px solid var(--border)',
        padding: '16px',
      },
      pageButtonsStyle: {
        borderRadius: '4px',
        height: '32px',
        padding: '0 8px',
        margin: '0 4px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover:not(:disabled)': {
          backgroundColor: 'var(--muted)',
        },
      },
    },
  };

  const handleRowClick = (row: any) => {
    setSelectedFundHouse(row.Scheme_Name);
    setPage(1);
  };

  if (!fundHouses || !funds) {
    return (
      <Layout requireAuth>
        <div className="p-8 text-center">
          <h3 className="text-lg font-semibold">Loading...</h3>
        </div>
      </Layout>
    );
  }

  return (
    <Layout requireAuth>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Mutual Funds</h1>
          <div className="flex items-center gap-2">
            <Label htmlFor="search" className="sr-only">
              Search
            </Label>
            <Input
              id="search"
              placeholder="Search funds..."
              className="max-w-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredFunds.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFunds.map((fund, index) => (
              <Card key={index} className="portfolio-card">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold line-clamp-2">
                    {fund.Scheme_Name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fund House:</span>
                    <span className="font-medium">{fund.AMC_Code || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minimum Amount:</span>
                    <span className="font-medium">₹{(fund.NAV || 0).toLocaleString('en-IN')}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => handleAddToPortfolio(fund)}
                  >
                    Add to Portfolio
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <h3 className="text-lg font-semibold">No funds found</h3>
            <p className="mt-2 text-muted-foreground">
              {searchTerm ? "Try a different search term." : "No funds available for this fund house."}
            </p>
          </div>
        )}

        {!isLoading && funds.length > 0 && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalRows ? Math.ceil(totalRows / perPage) : 1} | 
              Total Items: {totalRows} | 
              Items per page: {perPage}
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= Math.ceil(totalRows / perPage)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Funds;
