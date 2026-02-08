import React, { useState, useEffect, useRef } from 'react';

const CustomCursor = () => {
    const cursorDotRef = useRef(null);
    const cursorOutlineRef = useRef(null);
    const mousePos = useRef({ x: 0, y: 0 });
    const outlinePos = useRef({ x: 0, y: 0 });
    const requestRef = useRef();
    const [hoverButton, setHoverButton] = useState(false);

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

    // Use event delegation for hover states (works for dynamic elements like Clerk popovers)
    useEffect(() => {
        const handleMouseOver = (e) => {
            // Check if the hovered element or its parent matches our interactive selectors
            const target = e.target.closest('button, a, input, textarea, .float-card, .createNewBtn, .cl-userButtonPopoverActionButton, .cl-userButtonTrigger, .cl-footerActionLink, .actionBtn');
            if (target) {
                setHoverButton(true);
            }
        };

        const handleMouseOut = (e) => {
            const target = e.target.closest('button, a, input, textarea, .float-card, .createNewBtn, .cl-userButtonPopoverActionButton, .cl-userButtonTrigger, .cl-footerActionLink, .actionBtn');
            if (target) {
                setHoverButton(false);
            }
        };

        // Add listeners to document to catch all events regardless of when elements are created
        document.addEventListener('mouseover', handleMouseOver);
        document.addEventListener('mouseout', handleMouseOut);

        return () => {
            document.removeEventListener('mouseover', handleMouseOver);
            document.removeEventListener('mouseout', handleMouseOut);
        };
    }, []);

    return (
        <>
            <div className="cursor-dot" ref={cursorDotRef}></div>
            <div className={`cursor-outline ${hoverButton ? 'cursor-hover' : ''}`} ref={cursorOutlineRef}></div>
        </>
    );
};

export default CustomCursor;
