import React, { useState, useRef } from 'react';

interface ImageComparisonSliderProps {
    originalImage: string;
    processedImage: string;
    alt?: string;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
    alt = "Image comparison"
}) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const containerWidth = containerRect.width;

        // Get the X position depending on mouse or touch event
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const position = ((clientX - containerRect.left) / containerWidth) * 100;

        // Limit the position between 0 and 100
        setSliderPosition(Math.max(0, Math.min(100, position)));
    };

    const handleMouseDown = () => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const position = ((e.clientX - containerRect.left) / containerWidth) * 100;
            setSliderPosition(Math.max(0, Math.min(100, position)));
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-auto overflow-hidden rounded-lg cursor-col-resize"
            onMouseMove={handleMove}
            onTouchMove={handleMove}
            onMouseDown={handleMouseDown}
        >
            {/* Original image (behind) */}
            <img
                src={"/after.jpg"}
                alt={alt}
                className="w-full h-auto"
            />

            {/* Processed image (front, clipped) */}
            <div
                className="absolute top-0 left-0 h-full overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
            >
                <img
                    src={"/before.jpg"}
                    alt={alt}
                    className="w-full h-auto"
                    style={{
                        width: `${100 / (sliderPosition / 100)}%`,
                        maxWidth: `${100 / (sliderPosition / 100)}%`
                    }}
                />
            </div>

            {/* Slider line */}
            <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                style={{ left: `${sliderPosition}%` }}
            >
                {/* Slider handle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                    <div className="flex flex-col">
                        <span className="transform -rotate-90">⟨</span>
                        <span className="transform rotate-90">⟨</span>
                    </div>
                </div>
            </div>

            {/* Labels */}
            <div className="absolute bottom-4 left-4 px-2 py-1 bg-gray-800 bg-opacity-75 text-blue-400 text-sm rounded">
                Original
            </div>
            <div className="absolute bottom-4 right-4 px-2 py-1 bg-gray-800 bg-opacity-75 text-green-400 text-sm rounded">
                Processed
            </div>
        </div>
    );
};
