import React from 'react';
import { useAuth, RedirectToSignIn } from '@clerk/clerk-react';

const ProtectedRoute = ({ children }) => {
    const { isLoaded, isSignedIn } = useAuth();

    // Show loading state while Clerk is initializing
    if (!isLoaded) {
        return (
            <div className="authLoadingWrapper">
                <div className="authLoadingCard">
                    <div className="authLoadingLogo">
                        <img src="/code-sync.png" alt="CodeSync" />
                        <h1 className="logoText">Code<span>Sync</span></h1>
                    </div>
                    <div className="authLoadingSpinner">
                        <div className="spinner large"></div>
                        <p>Authenticating...</p>
                    </div>
                </div>
            </div>
        );
    }

    // If not signed in, redirect to sign-in page
    if (!isSignedIn) {
        return <RedirectToSignIn />;
    }

    // User is authenticated, render children
    return children;
};

export default ProtectedRoute;
