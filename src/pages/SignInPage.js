import React from 'react';
import { SignIn } from '@clerk/clerk-react';

const SignInPage = () => {
    return (
        <div className="authPageWrapper">
            {/* Background decorations */}
            <div className="authBgDecor">
                <div className="decorOrb orb1"></div>
                <div className="decorOrb orb2"></div>
                <div className="decorOrb orb3"></div>
            </div>

            {/* Header */}
            <header className="authHeader">
                <div className="navLeft">
                    <img className="navLogo" src="/code-sync.png" alt="CodeSync Logo" />
                    <h1 className="logoText">Code<span>Sync</span></h1>
                </div>
            </header>

            {/* Sign In component */}
            <main className="authMain">
                <div className="authContainer">
                    <SignIn
                        routing="path"
                        path="/sign-in"
                        signUpUrl="/sign-up"
                        afterSignInUrl="/dashboard"
                    />
                </div>
            </main>

            {/* Footer */}
            <footer className="authFooter">
                <span>© {new Date().getFullYear()} CodeSync. All rights reserved.</span>
            </footer>
        </div>
    );
};

export default SignInPage;
