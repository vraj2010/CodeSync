import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const CustomCursor = () => {
    const cursorDotRef = useRef(null);
    const cursorOutlineRef = useRef(null);
    const mousePos = useRef({ x: 0, y: 0 });
    const outlinePos = useRef({ x: 0, y: 0 });
    const requestRef = useRef();
    const [hoverButton, setHoverButton] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleMouseMove = (e) => {
            mousePos.current = { x: e.clientX, y: e.clientY };

            // Direct update for the dot (instant)
            if (cursorDotRef.current) {
                cursorDotRef.current.style.left = `${e.clientX}px`;
                cursorDotRef.current.style.top = `${e.clientY}px`;
            }

            // Update global CSS variables for spotlight effect
            document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
            document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
        };

        const animateOutline = () => {
            // Smooth lerp (0.15 factor for nice lag)
            const dx = mousePos.current.x - outlinePos.current.x;
            const dy = mousePos.current.y - outlinePos.current.y;

            outlinePos.current.x += dx * 0.15;
            outlinePos.current.y += dy * 0.15;

            if (cursorOutlineRef.current) {
                cursorOutlineRef.current.style.left = `${outlinePos.current.x}px`;
                cursorOutlineRef.current.style.top = `${outlinePos.current.y}px`;
            }

            requestRef.current = requestAnimationFrame(animateOutline);
        };

        window.addEventListener('mousemove', handleMouseMove);
        requestRef.current = requestAnimationFrame(animateOutline);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    // Re-attach hover listeners on route change and initial mount
    useEffect(() => {
        const addHoverEvents = () => {
            const clickables = document.querySelectorAll('button, a, input, textarea, .float-card, .createNewBtn');
            clickables.forEach(el => {
                el.addEventListener('mouseenter', () => setHoverButton(true));
                el.addEventListener('mouseleave', () => setHoverButton(false));
            });
        };

        // Small delay to ensure DOM is ready after route change
        const timer = setTimeout(addHoverEvents, 500);

        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <>
            <div className="cursor-dot" ref={cursorDotRef}></div>
            <div className={`cursor-outline ${hoverButton ? 'cursor-hover' : ''}`} ref={cursorOutlineRef}></div>
        </>
    );
};

export default CustomCursor;
