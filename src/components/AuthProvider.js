import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

// Check for the Clerk publishable key
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
    console.error('Missing Clerk Publishable Key. Please add REACT_APP_CLERK_PUBLISHABLE_KEY to your .env file');
}

// Custom appearance for Clerk components
const clerkAppearance = {
    baseTheme: undefined,
    variables: {
        colorPrimary: '#4aed88',
        colorBackground: '#1c1e29',
        colorInputBackground: '#2f3345',
        colorInputText: '#ffffff',
        colorText: '#e5e7eb',
        colorTextSecondary: '#94a3b8',
        colorDanger: '#ff4d4d',
        colorSuccess: '#4aed88',
        borderRadius: '10px',
        fontFamily: 'Inter, sans-serif',
    },
    elements: {
        // Sign in / Sign up card styling
        card: {
            backgroundColor: 'rgba(40, 42, 54, 0.95)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5)',
        },
        // Form inputs
        formFieldInput: {
            backgroundColor: '#2f3345',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
        },
        formFieldInput__focused: {
            borderColor: '#4aed88',
            boxShadow: '0 0 0 2px rgba(74, 237, 136, 0.15)',
        },
        // Primary buttons
        formButtonPrimary: {
            background: 'linear-gradient(135deg, #4aed88, #36d67a)',
            color: '#1c1e29',
            fontWeight: '700',
            boxShadow: '0 4px 15px rgba(74, 237, 136, 0.3)',
        },
        formButtonPrimary__hover: {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(74, 237, 136, 0.4)',
        },
        // Header
        headerTitle: {
            color: '#ffffff',
            fontWeight: '700',
        },
        headerSubtitle: {
            color: '#94a3b8',
        },
        // Social buttons
        socialButtonsBlockButton: {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#e5e7eb',
        },
        socialButtonsBlockButton__hover: {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
        },
        // Footer
        footerAction: {
            color: '#94a3b8',
        },
        footerActionLink: {
            color: '#4aed88',
        },
        // User button
        userButtonTrigger: {
            borderRadius: '12px',
        },
        avatarBox: {
            borderRadius: '12px',
        },
        // Identity preview
        identityPreview: {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
        // User Button Popover
        userButtonPopoverCard: {
            backgroundColor: 'rgba(40, 42, 54, 0.95)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5)',
        },
        userButtonPopoverMain: {
            backgroundColor: 'transparent',
            color: '#ffffff',
        },
        userButtonPopoverActionButton: {
            color: '#e5e7eb',
        },
        userButtonPopoverActionButtonIcon: {
            color: '#94a3b8',
        },
        userButtonPopoverFooter: {
            background: 'rgba(0,0,0,0.2)',
        },
        userPreviewMainIdentifier: {
            color: '#ffffff !important',
            fontWeight: '600',
        },
        userPreviewSecondaryIdentifier: {
            color: '#94a3b8 !important',
        },
    },
    layout: {
        socialButtonsPlacement: 'top',
        helpPageUrl: 'https://github.com/vraj2010',
        privacyPageUrl: 'https://github.com/vraj2010',
        termsPageUrl: 'https://github.com/vraj2010',
    },
};

const AuthProvider = ({ children }) => {
    if (!clerkPubKey) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'linear-gradient(135deg, #1c1e29, #151722)',
                color: '#ff4d4d',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'center',
                padding: '20px'
            }}>
                <div>
                    <h2>⚠️ Configuration Error</h2>
                    <p>Missing Clerk Publishable Key. Please check your environment variables.</p>
                </div>
            </div>
        );
    }

    return (
        <ClerkProvider
            publishableKey={clerkPubKey}
            appearance={clerkAppearance}
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
        >
            {children}
        </ClerkProvider>
    );
};

export default AuthProvider;
