import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const navigate = useNavigate();

    const handleNavigation = () => {
        navigate('/Sign-In');
    };

    return (
        <Container className="py-5"> 
            
            <div className="p-5 mb-4 bg-primary text-white rounded-3 shadow-lg">
                <Container fluid>
                    <h1 className="display-3 fw-bold">Trade Smarter. Trade with CloudEx.</h1>
                    <p className="col-md-9 fs-5">
                        Access global markets with real-time data, institutional-grade tools, and unparalleled security. Your next trade starts here.
                    </p>
                    <Button onClick={handleNavigation} variant="warning" size="lg" className="mt-4 fw-bold">
                        Open Free CloudEx Account
                    </Button>
                </Container>
            </div>

            <Row className="g-4 mb-5 text-center">
                
                <Col md={4}>
                    <Card className="h-100 border-secondary shadow-sm p-3">
                        <Card.Body>
                            <i className="bi bi-speedometer2 text-primary display-4 mb-3"></i> 
                            <h2 className="fs-4">Lightning-Fast Execution</h2>
                            <p className="text-muted">
                                Execute trades in milliseconds. Our optimized infrastructure ensures you capture price movements instantly.
                            </p>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className="h-100 border-secondary shadow-sm p-3">
                        <Card.Body>
                            <i className="bi bi-shield-lock text-success display-4 mb-3"></i> 
                            <h2 className="fs-4">Bank-Grade Security</h2>
                            <p className="text-muted">
                                Sleep soundly knowing your assets are protected by top-tier encryption and multi-factor authentication.
                            </p>
                        </Card.Body>
                    </Card>
                </Col>

                <Col md={4}>
                    <Card className="h-100 border-secondary shadow-sm p-3">
                        <Card.Body>
                            <i className="bi bi-graph-up-arrow text-info display-4 mb-3"></i> 
                            <h2 className="fs-4">Advanced Charting Tools</h2>
                            <p className="text-muted">
                                Analyze markets like a pro with customizable charts, indicators, and a powerful backtesting environment.
                            </p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <div className="p-5 text-center rounded-3 shadow border border-secondary">
                <h2 className="fw-bold mb-3">Ready to outperform the market?</h2>
                <p className="lead text-muted">Join CloudEx and elevate your trading experience today.</p>
                <Button onClick={handleNavigation} variant="warning" size="lg" className="mt-3 fw-bold">
                    Start Trading Now
                </Button>
            </div>

        </Container>
    );
};

export default HomePage;