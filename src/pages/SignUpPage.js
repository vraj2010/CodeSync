import React from 'react';
import { SignUp } from '@clerk/clerk-react';

const SignUpPage = () => {
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

            {/* Sign Up component */}
            <main className="authMain">
                <div className="authContainer">
                    <SignUp
                        routing="path"
                        path="/sign-up"
                        signInUrl="/sign-in"
                        afterSignUpUrl="/dashboard"
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

export default SignUpPage;
