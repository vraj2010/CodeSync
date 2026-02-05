import React, { useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';

const Home = () => {
    const navigate = useNavigate();
    const { isSignedIn, isLoaded } = useAuth();
    const { user } = useUser();
    const [roomId, setRoomId] = useState('');
    const [username, setUserName] = useState('');

    // If user is signed in, use their name
    const displayName = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || username;

    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidV4();
        setRoomId(id);
        toast.success('Created a New Room');
    };

    const joinRoom = () => {
        if (!roomId) {
            toast.error('Please enter a Room ID');
            return;
        }

        // For authenticated users, use Clerk user info
        if (isSignedIn) {
            navigate(`/editor/${roomId}`, {
                state: { username: displayName }
            });
            return;
        }

        // For unauthenticated quick access, require username
        if (!username) {
            toast.error('Please enter a username');
            return;
        }

        navigate(`/editor/${roomId}`, {
            state: { username }
        });
    };

    const handleInputEnter = (e) => {
        if (e.code === 'Enter') {
            joinRoom();
        }
    };

    return (
        <div className="mainContainer">
            <header className="mainHeader">
                <nav className="navContent">
                    <div className="navLeft">
                        <img className="navLogo" src="/code-sync.png" alt="Logo" />
                        <h1 className="logoText">Code<span>Sync</span></h1>
                    </div>
                    <div className="navRight">
                        <a href="#features" className="navLink">Features</a>
                        {isLoaded && (
                            isSignedIn ? (
                                <Link to="/dashboard" className="navBtn">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" style={{ marginRight: '6px' }}>
                                        <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/sign-in" className="navLink">Sign In</Link>
                                    <Link to="/sign-up" className="navBtn">
                                        Get Started
                                    </Link>
                                </>
                            )
                        )}
                    </div>
                </nav>
            </header>

            <main className="homePageWrapper">
                <div className="homeContent">
                    {/* Hero Section */}
                    <div className="heroSection">
                        <div className="heroText">
                            <span className="heroBadge">
                                <span className="badgeDot"></span>
                                Real-time Collaboration
                            </span>
                            <h1 className="heroTitle">
                                Code Together,<br />
                                <span className="gradientText">Build Better</span>
                            </h1>
                            <p className="heroDescription">
                                The ultimate real-time collaborative code editor. Write, share, and execute code
                                with your team instantly. Built for developers who love to collaborate.
                            </p>

                            {isSignedIn ? (
                                <div className="heroCTA">
                                    <Link to="/dashboard" className="ctaBtn primary">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Go to Dashboard
                                    </Link>
                                </div>
                            ) : (
                                <div className="heroCTA">
                                    <Link to="/sign-up" className="ctaBtn primary">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Get Started Free
                                    </Link>
                                    <Link to="/sign-in" className="ctaBtn secondary">
                                        Sign In
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Join Form */}
                    <div className="formWrapper">
                        <div className="formHeader">
                            <h4 className="mainLabel">Quick Join</h4>
                            <p className="formSubtext">Jump into a workspace instantly</p>
                        </div>
                        <div className="inputGroup">
                            <input
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                type="text"
                                className="inputBox"
                                placeholder="Enter Room ID"
                                onKeyUp={handleInputEnter}
                            />
                            {!isSignedIn && (
                                <input
                                    value={username}
                                    onChange={(e) => setUserName(e.target.value)}
                                    type="text"
                                    className="inputBox"
                                    placeholder="Your Display Name"
                                    onKeyUp={handleInputEnter}
                                />
                            )}
                            {isSignedIn && (
                                <div className="signedInAs">
                                    <span>Joining as:</span>
                                    <strong>{displayName}</strong>
                                </div>
                            )}
                            <button className="btn joinBtn" onClick={joinRoom}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                                    <path d="M13 5l7 7-7 7M5 12h15" />
                                </svg>
                                Join Now
                            </button>
                            <span className="createInfo">
                                Don't have a Room ID? &nbsp;
                                <a onClick={createNewRoom} href="#" className="createNewBtn">Generate New Room</a>
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Features Section */}
            <section id="features" className="featuresSection">
                <div className="featuresContainer">
                    <h2 className="sectionTitle">Why CodeSync?</h2>
                    <div className="featuresGrid">
                        <div className="featureCard">
                            <div className="featureIcon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3>Real-time Sync</h3>
                            <p>See your teammates' changes as they type. No delays, no conflicts.</p>
                        </div>
                        <div className="featureCard">
                            <div className="featureIcon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3>Private Rooms</h3>
                            <p>Control who can join your workspace with approval-based access.</p>
                        </div>
                        <div className="featureCard">
                            <div className="featureIcon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3>Code Execution</h3>
                            <p>Run your code in 15+ languages directly in the browser.</p>
                        </div>
                        <div className="featureCard">
                            <div className="featureIcon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </div>
                            <h3>Voice Chat</h3>
                            <p>Communicate with your team using built-in voice chat.</p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="footerMain">
                <div className="footerContent">
                    <span>&copy; {new Date().getFullYear()} CodeSync. All rights reserved.</span>
                    <div className="footerLinks">
                        <span className="authorTag">
                            Built with ❤️ by <a href="https://github.com/vraj2010">Vraj Patel</a>
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;