import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './dashboard-page/Dashboard';
import BuySell from './buy-sell-page/BuySell';
import Transactions from './transactions-page/TransactionsPage';
import HomePage from './home-page/HomePage';
import SignUp from './sign-up/SignUp';
import SignIn from './sign-in/SignIn';
import ResetPassword from './resest-password/ResetPassword';
import AdminPage from './Admin/AdminPage';
import FundsPage from './funds-page/FundsPage';
import ProfilePage from './profile-page/ProfilePage';

interface RouteComponentProps {
    signedIn: boolean;
    role: string
}

const RouteComponent: React.FC<RouteComponentProps> = ({ signedIn, role }) => {
    const DashboardRedirect = <Navigate to="/Dashboard" replace />;
    const SignInRedirect = <Navigate to="/Sign-In" replace />;
    const AdminRedirect = <Navigate to="/Admin" replace />;

    if (role === 'admin') {
        return (
            <Routes>
                <Route path="/Admin" element={<AdminPage />} />
                <Route path="*" element={AdminRedirect} />
            </Routes>
        );
    }

    return (
        <Routes>
            <Route path="/" element={signedIn ? DashboardRedirect : <HomePage />} />
            <Route path="/Home" element={signedIn ? DashboardRedirect : <HomePage />} />
            <Route path="/Sign-In" element={signedIn ? DashboardRedirect : <SignIn />} />
            <Route path="/Sign-Up" element={signedIn ? DashboardRedirect : <SignUp />} />
            <Route path="/Reset-Password" element={signedIn ? DashboardRedirect : <ResetPassword />} />

            <Route path="/Dashboard" element={signedIn ? <Dashboard /> : SignInRedirect} />
            <Route path="/Buy-Sell" element={signedIn ? <BuySell /> : SignInRedirect} />
            <Route path="/Funds" element={signedIn ? <FundsPage /> : SignInRedirect} /> 
            <Route path="/Transactions" element={signedIn ? <Transactions /> : SignInRedirect} />
            <Route path="/Profile" element={signedIn ? <ProfilePage /> : SignInRedirect} /> 
            <Route path="/Admin" element={signedIn ? DashboardRedirect : SignInRedirect} />
            <Route path="*" element={signedIn ? DashboardRedirect : SignInRedirect} />
        </Routes>
    );
};

export default RouteComponent;