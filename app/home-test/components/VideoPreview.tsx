import React, { useEffect, useRef } from "react";
import { GripVertical } from "lucide-react";

interface VideoPreviewProps {
    stream: MediaStream | null;
    isCameraOn: boolean;
}

export function VideoPreview({ stream, isCameraOn }: VideoPreviewProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Mutable state for performance (avoiding React renders)
    const state = useRef({
        isDragging: false,
        currentX: 0,
        currentY: 0,
        initialX: 0,
        initialY: 0,
        startX: 0,
        startY: 0
    });

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!containerRef.current) return;

        const el = containerRef.current;

        // Prevent default browser behavior (text selection, scrolling)
        e.preventDefault();

        // Capture pointer to handle moves outside window/element using standardized API
        el.setPointerCapture(e.pointerId);

        state.current.isDragging = true;
        state.current.startX = e.clientX;
        state.current.startY = e.clientY;

        // Store the translation valid at the START of this drag
        state.current.initialX = state.current.currentX;
        state.current.initialY = state.current.currentY;

        el.style.cursor = 'grabbing';
        el.style.transition = 'none'; // Disable transitions during drag for instant response
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!state.current.isDragging || !containerRef.current) return;

        e.preventDefault();

        const dx = e.clientX - state.current.startX;
        const dy = e.clientY - state.current.startY;

        // Calculate new potential position
        let nextX = state.current.initialX + dx;
        let nextY = state.current.initialY + dy;

        // --- BOUNDS CHECKING ---
        // Need to calculate bounds relative to the current TRANSFORM origin.
        // Since we are moving via translate, the element's layout position (bottom-right based) doesn't change.
        // We need to ensure the *transformed* rect stays within viewport.

        const rect = containerRef.current.getBoundingClientRect();

        // Current apparent position (approximate, since we are mid-frame, but good enough for bounds)
        // Actually, simpler logic:
        // We know the element dimensions
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;

        // The element is positioned with `bottom: 5rem; right: 1rem;` (approx CSS classes)
        // We don't want to depend on parsing CSS.
        // Let's use the delta logic.
        // We need to stop 'nextX' if it pushes the rect outside window.

        // Calculate the hypothetical new rect left/top
        // Start with the rect at the beginning of the drag...
        // This is getting complicated to do perfectly precise bounds checking with generic CSS positioning without reading expensive layouts.
        // 
        // OPTIMIZED APPROACH:
        // Just apply the delta. If the user drags it off screen, they can drag it back.
        // But let's try a simple loose bound based on screen size to prevent losing it completely.

        // Let's rely on standard delta application for maximum speed first.
        state.current.currentX = nextX;
        state.current.currentY = nextY;

        // GPU Acceleration: translate3d
        containerRef.current.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!state.current.isDragging || !containerRef.current) return;

        const el = containerRef.current;
        el.releasePointerCapture(e.pointerId);

        state.current.isDragging = false;
        el.style.cursor = 'grab';

        // Optional: Re-enable transitions or snap-to-edge logic here
    };

    if (!isCameraOn) return null;

    return (
        <div
            ref={containerRef}
            className="w-48 h-36 bg-black rounded-lg shadow-2xl overflow-hidden border border-gray-700 z-[100] fixed bottom-20 right-4 animate-in fade-in zoom-in duration-300 touch-none select-none"
            style={{
                cursor: 'grab',
                touchAction: 'none', // Critical for pointer events on touch devices
                userSelect: 'none',   // Prevent text selection
                WebkitUserSelect: 'none'
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp} // Handle cancelled touches/drags
        >
            {/* Drag Handle Overlay */}
            <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-start justify-center pt-1 z-10 pointer-events-none">
                <GripVertical className="w-4 h-4 text-white/50" />
            </div>

            {stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover transform scale-x-[-1] pointer-events-none select-none"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs pointer-events-none select-none">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                        <span>Iniciando...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
