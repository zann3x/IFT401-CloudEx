import React from 'react'
import { Card } from 'react-bootstrap';

interface TransactionsProps {
    date: string;
    type: string;
    stockName: string;
    stockSymbol: string;
    shares: number;
    pricePerShare: number;
    totalAmount: number;
}

const Transactions:React.FC<TransactionsProps> = ({date, type, stockName, stockSymbol, shares, pricePerShare, totalAmount}) => {
  return (
    <Card className='m-2 p-2'>
        <Card.Body>
            <Card.Title>{type} - {stockName} ({stockSymbol})</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">{date}</Card.Subtitle>
            <Card.Text>
                Shares: {shares} @ ${pricePerShare} each
            </Card.Text>
            <Card.Text>
                Total Amount: ${totalAmount}
            </Card.Text>
        </Card.Body>
    </Card>
  )
}

export default Transactions