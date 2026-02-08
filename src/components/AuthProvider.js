import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

// --------------------------------------------------
// ENV CHECK
// --------------------------------------------------
const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
    console.error(
        'Missing Clerk Publishable Key. Please add REACT_APP_CLERK_PUBLISHABLE_KEY to your .env file'
    );
}

// --------------------------------------------------
// CLERK APPEARANCE CONFIG
// --------------------------------------------------
const clerkAppearance = {
    variables: {
        colorPrimary: '#4aed88',
        colorBackground: '#1c1e29',
        colorInputBackground: '#2f3345',
        colorInputText: '#ffffff',

        // Used for placeholders, helper text, footer text
        colorTextSecondary: '#9ca3af',

        colorText: '#e5e7eb',
        colorDanger: '#ff4d4d',
        colorSuccess: '#4aed88',
        borderRadius: '12px',
        fontFamily: 'Inter, sans-serif',
    },

    elements: {
        /* ================= CARD ================= */
        card: {
            backgroundColor: 'rgba(40, 42, 54, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.55)',
            padding: '28px',
        },

        /* ================= HEADER ================= */
        headerTitle: {
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '1.5rem',
        },
        headerSubtitle: {
            color: '#9ca3af',
            fontSize: '0.95rem',
            marginTop: '6px',
        },

        /* ================= LABELS ================= */
        formFieldLabel: {
            color: '#e5e7eb',
            fontWeight: '500',
            marginBottom: '6px',
        },

        /* ================= INPUTS ================= */
        formFieldInput: {
            backgroundColor: '#2f3345',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#ffffff',
            padding: '12px 14px',
            fontSize: '0.95rem',
        },
        formFieldInput__focused: {
            borderColor: '#4aed88',
            boxShadow: '0 0 0 2px rgba(74,237,136,0.25)',
        },

        /* ================= ERRORS ================= */
        formFieldErrorText: {
            color: '#ff6b6b',
            fontSize: '0.85rem',
            marginTop: '6px',
        },

        /* ================= PRIMARY BUTTON ================= */
        formButtonPrimary: {
            background: 'linear-gradient(135deg, #4aed88, #36d67a)',
            color: '#1c1e29',
            fontWeight: '700',
            padding: '12px',
            fontSize: '0.95rem',
            borderRadius: '10px',
            boxShadow: '0 6px 20px rgba(74,237,136,0.35)',
        },
        formButtonPrimary__hover: {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 25px rgba(74,237,136,0.45)',
        },

        /* ================= DIVIDERS ================= */
        dividerLine: {
            backgroundColor: 'rgba(255,255,255,0.12)',
        },
        dividerText: {
            color: '#9ca3af',
            fontSize: '0.85rem',
        },

        /* ================= SOCIAL BUTTONS ================= */
        socialButtonsBlockButton: {
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#e5e7eb',
            padding: '12px',
            borderRadius: '10px',
        },
        socialButtonsBlockButton__hover: {
            backgroundColor: 'rgba(255,255,255,0.12)',
        },

        /* ================= FOOTER ================= */
        footerAction: {
            color: '#9ca3af',
            fontSize: '0.85rem',
        },
        footerActionLink: {
            color: '#4aed88',
            fontWeight: '500',
        },

        /* ================= USER BUTTON ================= */
        userButtonTrigger: {
            borderRadius: '12px',
        },
        avatarBox: {
            borderRadius: '12px',
        },

        /* ================= USER POPOVER ================= */
        userButtonPopoverActionButton: {
            color: '#e5e7eb',
            fontSize: '0.9rem',
            padding: '10px 12px',
            borderRadius: '8px',
            transition: 'all 0.15s ease',
        },
        userButtonPopoverActionButton__hover: {
            backgroundColor: 'rgba(74, 237, 136, 0.1)',
            color: '#4aed88',
        },
        userButtonPopoverActionButtonText: {
            color: '#e5e7eb',
            '&:hover': {
                color: '#4aed88 !important',
            }
        },
        userButtonPopoverActionButtonIcon: {
            color: '#9ca3af',
        },

        userButtonPopoverFooter: {
            backgroundColor: 'rgba(0,0,0,0.25)',
        },

        /* ================= USER INFO ================= */
        userPreviewMainIdentifier: {
            color: '#ffffff',
            fontWeight: '600',
        },
        userPreviewSecondaryIdentifier: {
            color: '#9ca3af',
        },
    },

    layout: {
        socialButtonsPlacement: 'top',
        helpPageUrl: '#',
        privacyPageUrl: '#',
        termsPageUrl: '#',
    },
};

// --------------------------------------------------
// AUTH PROVIDER
// --------------------------------------------------
const AuthProvider = ({ children }) => {
    if (!clerkPubKey) {
        return (
            <div
                style={{
                    height: '100vh',
                    display: 'grid',
                    placeItems: 'center',
                    background: 'linear-gradient(135deg, #1c1e29, #151722)',
                    color: '#ff4d4d',
                    fontFamily: 'Inter, sans-serif',
                    textAlign: 'center',
                    padding: 24,
                }}
            >
                <div>
                    <h2>⚠️ Configuration Error</h2>
                    <p>Missing Clerk Publishable Key</p>
                </div>
            </div>
        );
    }

    return (
        <ClerkProvider
            publishableKey={clerkPubKey}
            appearance={clerkAppearance}
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/dashboard"
            afterSignUpUrl="/dashboard"
        >
            {children}
        </ClerkProvider>
    );
};

export default AuthProvider;
