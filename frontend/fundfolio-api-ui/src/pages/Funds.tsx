
import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { fundsAPI } from "../services/api";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import DataTable from 'react-data-table-component';

interface FundSchema {
  Scheme_Name: string;
  Mutual_Fund_Family: string;
  Net_Asset_Value: number;
  data: any[];
  pagination: {
    current_page: number;
    total_items: number;
  };
}

const Funds: React.FC = () => {
  const [fundHouses, setFundHouses] = useState<string[]>([]);
  const [selectedFundHouse, setSelectedFundHouse] = useState<string>("");
  const [fundFamilies, setFundFamilies] = useState<string[]>([]);
  const [selectedFundFamily, setSelectedFundFamily] = useState<string>("Aditya Birla Sun Life Mutual Fund");
  const [funds, setFunds] = useState<FundSchema[]>([]);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Single useEffect for initial load
  useEffect(() => {
    const initializeData = async () => {
      try {
        const token = localStorage.getItem("access_token");
        // Fetch fund families
        const familiesResponse = await axios.get(`http://127.0.0.1:8000/funds/fund-families`, {
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        setFundFamilies(familiesResponse.data.fund_families);
        
        // Fetch initial funds data
        await fetchFunds("Aditya Birla Sun Life Mutual Fund", 1);
      } catch (error) {
        console.error("Error initializing data:", error);
      }
    };

    initializeData();
  }, []); // Empty dependency array as this should only run once on mount

  // Fetch fund houses on component mount
  useEffect(() => {
    const fetchFundHouses = async () => {
      setIsLoading(true);
      try {
        const response = await fundsAPI.getSchemes(
          selectedFundFamily || "Aditya Birla Sun Life Mutual Fund", // Use selected fund family or fallback to CAMS
          1,
          localStorage.getItem("access_token")
        );
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
  }, [selectedFundFamily]); // Add selectedFundFamily as dependency

  // Fetch funds when selected fund house or page changes
  // Remove the initial fetchFundHouses useEffect and combine with fetchFunds
  useEffect(() => {
    const fetchFunds = async () => {
      if (!selectedFundFamily) return; // Only fetch if a fund family is selected
      
      setIsLoading(true);
      try {
        const accessToken = localStorage.getItem("access_token");
        const response = await fundsAPI.getSchemes(
          selectedFundFamily,
          page,
          accessToken
        );
        if (response && response.data) {
          setFunds(response.data);
          setFundHouses(response.data);
          // Update pagination state based on response
          if (response.pagination) {
            setTotalRows(response.pagination.total_items || 0);
            setPage(response.pagination.current_page || 1);
          }
        } else {
          setFunds([]);
          setFundHouses([]);
          setTotalRows(0);
        }
      } catch (error) {
        console.error("Error fetching funds:", error);
        setFunds([]);
        setFundHouses([]);
        setTotalRows(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFunds();
  }, [selectedFundFamily, page]); // Only depend on selectedFundFamily and page

  // Add new useEffect for fetching fund families
  useEffect(() => {
    const fetchFundFamilies = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get(`http://127.0.0.1:8000/funds/fund-families`, {
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        setFundFamilies(response.data.fund_families);
      } catch (error) {
        console.error("Error fetching fund families:", error);
      }
    };

    fetchFundFamilies();
  }, []);

  const fetchFunds = async (family: string, pageNumber: number) => {
    if (!family) return;
    
    setIsLoading(true);
    try {
      const accessToken = localStorage.getItem("access_token");
      const response = await fundsAPI.getSchemes(
        family,
        pageNumber,
        accessToken
      );
      if (response && response.data) {
        setFunds(response.data);
        setFundHouses(response.data);
        if (response.pagination) {
          setTotalRows(response.pagination.total_items || 0);
          setPage(response.pagination.current_page || 1);
        }
      } else {
        setFunds([]);
        setFundHouses([]);
        setTotalRows(0);
      }
    } catch (error) {
      console.error("Error fetching funds:", error);
      setFunds([]);
      setFundHouses([]);
      setTotalRows(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFundFamilyChange = (value: string) => {
    setSelectedFundFamily(value);
    setPage(1);
    fetchFunds(value, 1);
  };

  const handlePageChange = (page: number) => {
    setPage(page);
    fetchFunds(selectedFundFamily, page);
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
      name: 'Net_Asset_Value',
      selector: (row: FundSchema) => row.Net_Asset_Value || 0,
      sortable: true,
      format: (row: FundSchema) => `₹${(row.Net_Asset_Value || 0).toLocaleString('en-IN')}`,
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
          <div className="flex items-center gap-4">
            <div className="w-[200px]">
              <Select
                value={selectedFundFamily}
                onValueChange={handleFundFamilyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Fund Family" />
                </SelectTrigger>
                <SelectContent>
                  {fundFamilies.map((family) => (
                    <SelectItem key={family} value={family}>
                      {family}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                    <span className="font-medium">{fund.Mutual_Fund_Family || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">NAV:</span>
                    <span className="font-medium">₹{(fund.Net_Asset_Value || 0).toLocaleString('en-IN')}</span>
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
              Total Items: {totalRows} | 
              Items per page: {perPage}
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(1)}
                disabled={page === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.ceil(totalRows / perPage) }, (_, i) => {
                const pageNumber = i + 1;
                // Show current page, first page, last page, and pages around current
                const shouldShow = 
                  pageNumber === 1 || 
                  pageNumber === Math.ceil(totalRows / perPage) ||
                  Math.abs(pageNumber - page) <= 2;

                if (!shouldShow && Math.abs(pageNumber - page) === 3) {
                  return <span key={pageNumber}>...</span>;
                }

                return shouldShow ? (
                  <Button
                    key={pageNumber}
                    variant={page === pageNumber ? "default" : "outline"}
                    onClick={() => handlePageChange(pageNumber)}
                    className="min-w-[40px]"
                  >
                    {pageNumber}
                  </Button>
                ) : null;
              })}
              <Button
                variant="outline"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= Math.ceil(totalRows / perPage)}
              >
                Next
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePageChange(Math.ceil(totalRows / perPage))}
                disabled={page >= Math.ceil(totalRows / perPage)}
              >
                Last
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Funds;
