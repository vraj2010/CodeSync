import React, { useState } from 'react';
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import {useNavigate} from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState('');
    const [username, setUserName] = useState('');

    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidV4();
        setRoomId(id);
        toast.success('Created a New Room');
    };

    const joinRoom = () => {
        if(!roomId || !username){
            toast.error('Room ID & Username is required');
            return;
        }
        navigate(`/editor/${roomId}`, {
            state:{
                username,
            }
        })
    }

    const handleInputEnter = (e) => {
        console.log('event', e.code);
        if(e.code === 'Enter'){
            joinRoom();
        }
    }

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
                        <a href="https://github.com/vraj2010" target="_blank" rel="noreferrer" className="navBtn">
                            <i className="fab fa-github"></i> Star on GitHub
                        </a>
                    </div>
                </nav>
            </header>

            <main className="homePageWrapper">
                <div className="formWrapper">
                    <h4 className="mainLabel">Enter Workspace Details</h4>
                    <div className="inputGroup">
                        <input 
                            value={roomId} 
                            onChange={(e) => setRoomId(e.target.value)} 
                            type="text" 
                            className="inputBox" 
                            placeholder="ROOM ID"
                            onKeyUp={handleInputEnter}
                        />
                        <input 
                            value={username} 
                            onChange={(e) => setUserName(e.target.value)}
                            type="text" 
                            className="inputBox" 
                            placeholder="USERNAME"
                            onKeyUp={handleInputEnter}
                        />
                        <button className="btn joinBtn" onClick={joinRoom}>Join Now</button> 
                        <span className="createInfo">
                            Need a private workspace? &nbsp;
                            <a onClick={createNewRoom} href="/" className="createNewBtn">New Room</a>
                        </span>
                    </div>
                </div>
            </main>

            <footer className="footerMain">
                <div className="footerContent">
                    <span>&copy; {new Date().getFullYear()} CodeSync. All rights reserved.</span>
                    <div className="footerLinks">
                        {/* <a href="/">Privacy</a>
                        <a href="/">Terms</a> */}
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