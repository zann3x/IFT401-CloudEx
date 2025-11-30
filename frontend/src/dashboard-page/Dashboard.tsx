import { Card, Container, Row, Col } from "react-bootstrap";
import { useState, useEffect, useCallback } from "react";
import Stocks from "../stocks/Stocks";
import DashboardPortfolio from "../portfolio/DashboardPortfolio";
import {
    getTopLosers,
    getTopGainers,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    getPortfolio,
    getUserBalance,
    // 1. Import the new API function
    getDailyPortfolioChange
} from "../Api";

interface StockData {
    stock_id: string;
    symbol: string;
    company_name: string;
    price: number | null | undefined;
    previous_price: number | null | undefined;
    percentage_change?: number;
    isWishlisted?: boolean;
}

interface PortfolioHolding {
    stock_id: string;
    total_shares: number;
    current_price: number;
    previous_total_value: number;
}

const mapStockTuple = (tuple: any[]): StockData => ({
    stock_id: String(tuple[0]),
    symbol: tuple[1],
    company_name: tuple[2],
    price: tuple[3],
    previous_price: tuple[4],
    percentage_change: tuple[5],
});

const updateStockWishlistStatus = (
    stocks: StockData[],
    newWishlist: Set<string>
): StockData[] => {
    return stocks.map(stock => ({
        ...stock,
        isWishlisted: newWishlist.has(stock.stock_id)
    }));
};

const Dashboard = () => {
    const [accountBalance, setAccountBalance] = useState(0.0);
    const [totalPortfolioValue, setTotalPortfolioValue] = useState(0.0);
    const [dailyChange, setDailyChange] = useState(0.0);
    const [percentageChange, setPercentageChange] = useState(0.0);

    const [topLosers, setTopLosers] = useState<StockData[]>([]);
    const [topGainers, setTopGainers] = useState<StockData[]>([]);
    const [wishlist, setWishlist] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const user_id = localStorage.getItem('user_id') || '';

    // --- Helper Fetch Functions (Unchanged) ---

    const fetchWishlist = async (id: string) => {
        try {
            const listResponse = await getWishlist(id);
            const rawWishlist = listResponse.watchlist || [];

            const wishlistIds = Array.isArray(rawWishlist)
                ? rawWishlist.map(String)
                : [];

            return wishlistIds;
        } catch (err) {
            return [];
        }
    };

    const handleWishlistToggle = useCallback(async (stockId: string) => {
        if (!user_id) return;

        setWishlist(prevWishlist => {
            const isCurrentlyWishlisted = prevWishlist.has(stockId);

            const performAction = async () => {
                if (isCurrentlyWishlisted) {
                    try {
                        await removeFromWishlist(user_id, stockId);
                    } catch {
                        return prevWishlist;
                    }
                } else {
                    try {
                        await addToWishlist(user_id, stockId);
                    } catch {
                        return prevWishlist;
                    }
                }

                const newSet = new Set(prevWishlist);
                isCurrentlyWishlisted ? newSet.delete(stockId) : newSet.add(stockId);

                setTopLosers(prev => updateStockWishlistStatus(prev, newSet));
                setTopGainers(prev => updateStockWishlistStatus(prev, newSet));

                return newSet;
            };

            performAction();

            const optimisticSet = new Set(prevWishlist);
            isCurrentlyWishlisted ? optimisticSet.delete(stockId) : optimisticSet.add(stockId);
            return optimisticSet;
        });
    }, [user_id]);

    // --- Main Data Fetch Hook ---

    useEffect(() => {
        const fetchAllData = async () => {
            if (!user_id) {
                setLoading(false);
                setError("User ID not found. Please log in.");
                return;
            }

            try {
                setLoading(true);

                // 2. Fetch all summary data in parallel
                const [balanceResponse, portfolioResponse, changeResponse] = await Promise.all([
                    getUserBalance(user_id),
                    getPortfolio(user_id),
                    // Fetch the daily change directly from the backend
                    getDailyPortfolioChange(user_id) 
                ]);

                // Calculate Total Portfolio Value (Holdings + Cash)
                const holdings: PortfolioHolding[] = portfolioResponse.holdings || [];
                const currentBalance = Number(balanceResponse.balance) || 0;
                
                // --- CONSOLE LOG ADDED HERE (from prior fix) ---
                console.log("[DEBUG] Raw Daily Change Response:", changeResponse);
                
                // FIX 1: Use the correct key: changeResponse.daily_portfolio_change
                // FIX 2: Use parseFloat for reliable parsing of the decimal string
                const dailyChangeAmount = parseFloat(changeResponse.daily_portfolio_change || '0') || 0; 
                
                // --- CONSOLE LOG ADDED HERE (from prior fix) ---
                console.log("[DEBUG] Parsed Daily Change Amount:", dailyChangeAmount);

                let totalCurrentHoldingsValue = 0;
                
                // Calculate only the current total holdings value
                holdings.forEach(holding => {
                    totalCurrentHoldingsValue += (holding.total_shares || 0) * (holding.current_price || 0);
                });

                const totalValueWithCash = totalCurrentHoldingsValue + currentBalance;
                
                // Set Portfolio Summary State
                setAccountBalance(currentBalance);
                setTotalPortfolioValue(totalValueWithCash);
                
                // 3. Set dailyChange directly from API response
                setDailyChange(dailyChangeAmount); 
                
                // 4. Calculate Percentage Change based on API change value
                const previousTotalValue = totalValueWithCash - dailyChangeAmount;
                if (previousTotalValue > 0) {
                    setPercentageChange((dailyChangeAmount / previousTotalValue) * 100);
                } else {
                    setPercentageChange(0);
                }
                
                // Fetch Market Data (Existing Logic)
                const wishlistIds = await fetchWishlist(user_id);
                const initialWishlistSet = new Set(wishlistIds);
                setWishlist(initialWishlistSet);

                const [losersResponse, gainersResponse] = await Promise.all([
                    getTopLosers(),
                    getTopGainers()
                ]);

                const losersData = (losersResponse.top_losers || []).map((tuple: any[]) => {
                    const stock = mapStockTuple(tuple);
                    const isWishlisted = initialWishlistSet.has(stock.stock_id);
                    return { ...stock, isWishlisted };
                });

                const gainersData = (gainersResponse.top_gainers || []).map((tuple: any[]) => {
                    const stock = mapStockTuple(tuple);
                    const isWishlisted = initialWishlistSet.has(stock.stock_id);
                    return { ...stock, isWishlisted };
                });

                setTopLosers(losersData);
                setTopGainers(gainersData);

                setError(null);
            } catch (err) {
                setError("Failed to load portfolio or market data.");
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [user_id]);

    // 🎨 NEW LOGIC: Determine the color class based on the daily change value
    const dailyChangeColorClass = dailyChange > 0 ? 'text-success' : dailyChange < 0 ? 'text-danger' : 'text-muted';

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <p>Loading market data, portfolio, and wishlist...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5 text-center text-danger">
                <p>{error}</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <DashboardPortfolio
                accountBalance={accountBalance}
                totalPortfolioValue={totalPortfolioValue}
                dailyChange={dailyChange}
                percentageChange={percentageChange}
                // NEW PROP: Pass the color class to the portfolio display component
                changeColorClass={dailyChangeColorClass} 
            />

            <Row className="g-4 mt-3">
                <Col xs={12} md={6}>
                    <Card className="p-3">
                        <h5>Top Losers 📉</h5>
                        {topLosers.length > 0 ? topLosers.map((stock, index) => (
                            <Stocks
                                key={stock.stock_id}
                                isLast={index === topLosers.length - 1}
                                currentPrice={stock.price ?? 0}
                                previousPrice={stock.previous_price ?? 0}
                                companyName={stock.company_name}
                                stockName={stock.symbol}
                                stockId={stock.stock_id}
                                isWishlisted={stock.isWishlisted ?? false}
                                onWishlistChange={handleWishlistToggle}
                                user_id={user_id}
                            />
                        )) : <p className="text-muted">No losers found.</p>}
                    </Card>
                </Col>

                <Col xs={12} md={6}>
                    <Card className="p-3">
                        <h5>Top Gainers 📈</h5>
                        {topGainers.length > 0 ? topGainers.map((stock, index) => (
                            <Stocks
                                key={stock.stock_id}
                                isLast={index === topGainers.length - 1}
                                currentPrice={stock.price ?? 0}
                                previousPrice={stock.previous_price ?? 0}
                                companyName={stock.company_name}
                                stockName={stock.symbol}
                                stockId={stock.stock_id}
                                isWishlisted={stock.isWishlisted ?? false}
                                onWishlistChange={handleWishlistToggle}
                                user_id={user_id}
                            />
                        )) : <p className="text-muted">No gainers found.</p>}
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Dashboard;