import React from "react";
import "./Stocks.css";
import { Col, Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { BsHeart, BsHeartFill } from 'react-icons/bs';

interface StockProps {
    isLast?: boolean;
    currentPrice: number;
    previousPrice: number;
    companyName: string;
    stockName: string;
    stockId: string;
    isWishlisted: boolean; 
    onWishlistChange: (stockId: string) => void;
    user_id: string;
}

const Stocks: React.FC<StockProps> = ({
    isLast,
    currentPrice,
    previousPrice,
    companyName,
    stockName,
    stockId,
    isWishlisted,
    onWishlistChange,
    user_id
}) => {
    const navigate = useNavigate();

    const diff = currentPrice - previousPrice;
    const percentageChange = previousPrice !== 0 ? (diff / previousPrice) * 100 : 0;
    const colorClass = diff < 0 ? "negative-price" : diff > 0 ? "positive-price" : "neutral-price";
    const symbol = diff > 0 ? "+" : "";

    const handleStockClick = () => {
        navigate(`/stock/${stockName}`);
    };

    const handleWishlistClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (!user_id) return;
        onWishlistChange(stockId);
    };

    return (
        <Container 
            className={isLast ? "pb-2 mb-2" : "stocks-border pb-2 mb-2"} 
            onClick={handleStockClick} 
            style={{ cursor: 'pointer' }}
        >
            <Row className="align-items-center">
                <Col xs={6}>
                    <h6 className="m-0">{companyName}</h6>
                    <h6 className="m-0 text-muted small">{stockName}</h6>
                </Col>
                
                <Col xs={4} className="text-end">
                    <h6 className="m-0">${currentPrice}</h6>
                    <h6 className={colorClass}>
                        {symbol}{diff.toFixed(2)} ({percentageChange.toFixed(2)}%)
                    </h6>
                </Col>
                
                <Col xs={2} className="text-end">
                    <div 
                        onClick={handleWishlistClick} 
                        className="wishlist-icon-container" 
                        style={{ cursor: 'pointer' }}
                    >
                        {isWishlisted ? (
                            <BsHeartFill size={25} className="wishlist-icon filled" />
                        ) : (
                            <BsHeart size={25} className="wishlist-icon outline" />
                        )}
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default Stocks;
