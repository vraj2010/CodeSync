import React, { useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk, UserButton } from '@clerk/clerk-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const { signOut } = useClerk();
    const [roomId, setRoomId] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const createNewRoom = () => {
        setIsCreating(true);
        const id = uuidV4();
        setRoomId(id);
        toast.success('✨ New room created!');
        setTimeout(() => setIsCreating(false), 500);
    };

    const joinRoom = () => {
        if (!roomId.trim()) {
            toast.error('Please enter a Room ID');
            return;
        }

        // Use Clerk user's name or fall back to email/username
        const username = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Anonymous';

        navigate(`/editor/${roomId}`, {
            state: { username }
        });
    };

    const handleInputEnter = (e) => {
        if (e.key === 'Enter') {
            joinRoom();
        }
    };

    return (
        <div className="dashboardWrapper">
            {/* Background decorations */}
            <div className="dashboardBgDecor">
                <div className="decorOrb orb1"></div>
                <div className="decorOrb orb2"></div>
                <div className="decorOrb orb3"></div>
                <div className="gridPattern"></div>
            </div>

            {/* Header */}
            <header className="dashboardHeader">
                <nav className="dashboardNav">
                    <div className="navLeft">
                        <img className="navLogo" src="/code-sync.png" alt="CodeSync Logo" />
                        <h1 className="logoText">Code<span>Sync</span></h1>
                    </div>
                    <div className="navRight">
                        <a
                            href="https://github.com/vraj2010"
                            target="_blank"
                            rel="noreferrer"
                            className="githubLink"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                        </a>
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: 'dashboardAvatar',
                                    userButtonTrigger: 'userButtonTrigger'
                                }
                            }}
                        />
                    </div>
                </nav>
            </header>

            {/* Main content */}
            <main className="dashboardMain">
                {/* Welcome section */}
                <section className="welcomeSection">
                    <div className="welcomeContent">
                        <h1 className="welcomeTitle">
                            Welcome back, <span className="userName">{user?.firstName || 'Developer'}</span>!
                        </h1>
                        <p className="welcomeSubtitle">
                            Ready to collaborate? Create a new workspace or join an existing one.
                        </p>
                    </div>
                </section>

                {/* Room actions */}
                <section className="roomActionsSection">
                    <div className="roomActionCards">
                        {/* Create Room Card */}
                        <div className="actionCard createCard">
                            <div className="cardIcon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <h3>Create New Workspace</h3>
                            <p>Start a new collaborative coding session. You'll be the admin with full control.</p>
                            <button
                                className={`btn createRoomBtn ${isCreating ? 'creating' : ''}`}
                                onClick={createNewRoom}
                                disabled={isCreating}
                            >
                                {isCreating ? (
                                    <>
                                        <span className="spinner"></span>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                            <path d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create Room
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Join Room Card */}
                        <div className="actionCard joinCard">
                            <div className="cardIcon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
                                </svg>
                            </div>
                            <h3>Join Existing Workspace</h3>
                            <p>Enter a Room ID to collaborate with your team in real-time.</p>
                            <div className="joinInputGroup">
                                <input
                                    type="text"
                                    className="roomIdInput"
                                    placeholder="Enter Room ID"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    onKeyUp={handleInputEnter}
                                />
                                <button className="btn joinRoomBtn" onClick={joinRoom}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
                                        <path d="M13 5l7 7-7 7M5 12h15" />
                                    </svg>
                                    Join
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Quick tips */}

            </main>

            {/* Footer */}
            <footer className="dashboardFooter">
                <div className="footerContent">
                    <span>© {new Date().getFullYear()} CodeSync. All rights reserved.</span>
                    <span className="authorTag">
                        Built with ❤️ by <a href="https://github.com/vraj2010">Vraj Patel</a>
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default Dashboard;
