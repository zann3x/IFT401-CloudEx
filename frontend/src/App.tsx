import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import RouteComponent from './RouteComponent';
import NavigationBar from './navigation_bar/NavigationBar';
import { checkLoginStatus } from './Api';
import { getUserRole } from './Api';
import axios from 'axios';

function App() {
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [role, setRole] = useState("");
    const [loadingStatus, setLoadingStatus] = useState(true);
    
    const location = useLocation();

    useEffect(() => {
        const storedUserId = localStorage.getItem('user_id');

        setIsSignedIn(false);
        setRole("");
        setLoadingStatus(true); 

        if (storedUserId) {
            checkStatus(storedUserId);
        } else {
            setLoadingStatus(false);
        }

    }, [location.pathname]); 

    const fetchAndSetRole = async (userId: string) => {
        try {
            const roleResponse = await getUserRole(userId);
            console.log("API Response from getUserRole:", roleResponse.role_name || roleResponse.user_role);
            
            const userRole = roleResponse.role_name || "";
            setRole(userRole);
        } catch (error) {
            console.error("Failed to fetch user role separately:", error);
            setRole("");
        }
    }

    const checkStatus = async (userId: string) => {
        try {
            const response = await checkLoginStatus(userId);
            const isUserLoggedIn = response.is_logged_in === true;
            
            if (isUserLoggedIn) {
                setIsSignedIn(true);
                if (response.user_role) {
                    setRole(response.user_role);
                } else {
                    await fetchAndSetRole(userId);
                }
            } else {
                setIsSignedIn(false);
                setRole("");
            }

        } catch (error) {
            if (axios.isAxiosError(error) && error.response && error.response.status === 404) {
                localStorage.removeItem('user_id');
            }
            
            setIsSignedIn(false);
            setRole("");

        } finally {
            setLoadingStatus(false);
        }
    };

    if (loadingStatus) {
        return <div></div>;
    }

    return (
        <>
            <NavigationBar signedIn={isSignedIn} setSignedIn={setIsSignedIn} role={role} /> 
            <RouteComponent signedIn={isSignedIn} role={role} /> 
        </>
    );
}

export default App;