import React, { useState, useRef, useEffect } from 'react';
import { uploadImage, getUserImageCount } from '../../api/api';
import { ImageMeta } from '../../types';

interface ImageUploaderProps {
    onUploadSuccess: (newImage: ImageMeta) => void;
    currentImages?: ImageMeta[];
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onUploadSuccess, currentImages }) => {
    const [file, setFile] = useState<File | null>(null);
    const [width, setWidth] = useState<number>(800);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [cropX, setCropX] = useState<number>(0);
    const [cropY, setCropY] = useState<number>(0);
    const [cropWidth, setCropWidth] = useState<number>(0);
    const [cropHeight, setCropHeight] = useState<number>(0);
    const [previewSrc, setPreviewSrc] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [cropPreviewVisible, setCropPreviewVisible] = useState(false);
    const [originalImageDimensions, setOriginalImageDimensions] = useState({ width: 0, height: 0 });
    const [tintColor, setTintColor] = useState('');
    const [tintPreview, setTintPreview] = useState(false);
    const [imageCount, setImageCount] = useState<number | null>(null);
    const [isLoadingCount, setIsLoadingCount] = useState(false);

    const IMAGE_LIMIT = 20; // Define the maximum number of images allowed

    const fileInputRef = useRef<HTMLInputElement>(null);
    const imagePreviewRef = useRef<HTMLImageElement>(null);
    const cropPreviewRef = useRef<HTMLDivElement>(null);
    const tintOverlayRef = useRef<HTMLDivElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    // Load image count on component mount
    useEffect(() => {
        const fetchImageCount = async () => {
            setIsLoadingCount(true);
            try {
                // If currentImages prop is available, use its length
                if (currentImages) {
                    setImageCount(currentImages.length);
                } else {
                    // Otherwise fetch images from API
                    const { count } = await getUserImageCount();
                    setImageCount(count);
                }
            } catch (err) {
                console.error("Failed to fetch image count:", err);
                setError('Unable to check current image count');
            } finally {
                setIsLoadingCount(false);
            }
        };

        fetchImageCount();
    }, [currentImages]);

    // For interactive crop preview
    useEffect(() => {
        if (previewSrc && cropPreviewVisible && imagePreviewRef.current && cropPreviewRef.current && imageContainerRef.current) {
            const img = imagePreviewRef.current;
            const preview = cropPreviewRef.current;
            const container = imageContainerRef.current;

            // Wait for image to load to get correct dimensions
            if (img.complete) {
                updateCropPreview();
            } else {
                img.onload = updateCropPreview;
            }

            function updateCropPreview() {
                // Get the actual displayed size of the image
                const rect = img.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();

                // Calculate scale factors for preview
                const scaleX = rect.width / originalImageDimensions.width;
                const scaleY = rect.height / originalImageDimensions.height;

                // Calculate position relative to container
                const offsetX = (containerRect.width - rect.width) / 2;
                const offsetY = (containerRect.height - rect.height) / 2;

                // Update crop preview position and size
                preview.style.left = `${offsetX + cropX * scaleX}px`;
                preview.style.top = `${offsetY + cropY * scaleY}px`;
                preview.style.width = `${cropWidth * scaleX}px`;
                preview.style.height = `${cropHeight * scaleY}px`;
            }
        }
    }, [cropX, cropY, cropWidth, cropHeight, previewSrc, cropPreviewVisible, originalImageDimensions]);

    // Update tint overlay
    useEffect(() => {
        if (previewSrc && tintOverlayRef.current && imagePreviewRef.current && tintPreview && tintColor) {
            const img = imagePreviewRef.current;
            const overlay = tintOverlayRef.current;

            if (img.complete) {
                updateTintOverlay();
            } else {
                img.onload = updateTintOverlay;
            }

            function updateTintOverlay() {
                const rect = img.getBoundingClientRect();

                overlay.style.left = `${rect.left - img.parentElement!.getBoundingClientRect().left}px`;
                overlay.style.top = `${rect.top - img.parentElement!.getBoundingClientRect().top}px`;
                overlay.style.width = `${rect.width}px`;
                overlay.style.height = `${rect.height}px`;
                overlay.style.backgroundColor = tintColor;
                overlay.style.opacity = "0.5";
            }
        }
    }, [tintColor, previewSrc, tintPreview]);

    // When advanced mode is active, sync width with crop width
    useEffect(() => {
        if (showAdvanced && cropWidth > 0) {
            setWidth(cropWidth);
        }
    }, [cropWidth, showAdvanced]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // First check if we're at the image limit
        if (imageCount !== null && imageCount >= IMAGE_LIMIT) {
            setError(`You have reached the maximum limit of ${IMAGE_LIMIT} images. Please delete some images before uploading more.`);
            return;
        }

        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);

            const reader = new FileReader();
            reader.onload = (e) => {
                const imageSrc = e.target?.result as string;
                setPreviewSrc(imageSrc);
                // Reset crop values when new image is loaded
                setCropX(0);
                setCropY(0);
                setCropWidth(0);
                setCropHeight(0);

                // Auto-get image dimensions once loaded
                const img = new Image();
                img.onload = () => {
                    setOriginalImageDimensions({ width: img.width, height: img.height });
                    setCropWidth(img.width);
                    setCropHeight(img.height);
                };
                img.src = imageSrc;
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        // First check if we're at the image limit
        if (imageCount !== null && imageCount >= IMAGE_LIMIT) {
            setError(`You have reached the maximum limit of ${IMAGE_LIMIT} images. Please delete some images before uploading more.`);
            return;
        }

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type.startsWith('image/')) {
                setFile(droppedFile);

                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageSrc = e.target?.result as string;
                    setPreviewSrc(imageSrc);
                    setCropX(0);
                    setCropY(0);
                    setCropWidth(0);
                    setCropHeight(0);

                    // Auto-get image dimensions once loaded
                    const img = new Image();
                    img.onload = () => {
                        setOriginalImageDimensions({ width: img.width, height: img.height });
                        setCropWidth(img.width);
                        setCropHeight(img.height);
                    };
                    img.src = imageSrc;
                };
                reader.readAsDataURL(droppedFile);
            } else {
                setError('Please select an image file');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        // Check image limit before attempting upload
        if (imageCount !== null && imageCount >= IMAGE_LIMIT) {
            setError(`You have reached the maximum limit of ${IMAGE_LIMIT} images. Please delete some images before uploading more.`);
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            console.log("Starting upload...");

            // Only send crop parameters if we're cropping (i.e., not using full image)
            const isCropping = showAdvanced &&
                (cropX > 0 || cropY > 0 ||
                    (cropWidth > 0 && cropWidth < originalImageDimensions.width) ||
                    (cropHeight > 0 && cropHeight < originalImageDimensions.height));

            // Check if we're tinting
            const isTinting = showAdvanced && tintColor && tintColor.trim() !== '';

            // Calculate whether we should resize
            const shouldResize = !showAdvanced && width !== originalImageDimensions.width;

            // Only send parameters if we're modifying the image
            const params: any = {};

            // If in advanced mode, use crop width as resize width
            if (isCropping) {
                params.cropX = Math.round(cropX);
                params.cropY = Math.round(cropY);
                params.cropWidth = Math.round(cropWidth);
                params.cropHeight = Math.round(cropHeight);
                params.originalWidth = originalImageDimensions.width;
                params.originalHeight = originalImageDimensions.height;
                params.width = params.cropWidth;  // Crop width becomes the resize width

                console.log("Sending crop parameters:", {
                    cropX: params.cropX,
                    cropY: params.cropY,
                    cropWidth: params.cropWidth,
                    cropHeight: params.cropHeight,
                    originalDimensions: originalImageDimensions
                });
            } else if (shouldResize) {
                // Only apply resize if not cropping
                params.width = width;
            }

            // Add tint color if specified
            if (isTinting) {
                params.tintColor = tintColor;
                params.tintOpacity = 0.5;
            }

            console.log("Upload params:", params);
            const response = await uploadImage(file, params);
            console.log("Upload response:", response);

            // Create an image metadata object from the response
            const newImage: ImageMeta = {
                id: response.id,
                file_name: file.name,
                url: response.original_url,
                size: file.size,
                uploaded: new Date().toISOString(),
                width: response.width || 0,
                height: response.height || 0,
                content_type: file.type,
                processing_status: (isCropping || shouldResize || isTinting) ? 'pending' : undefined
            };

            console.log("Created new image metadata:", newImage);
            onUploadSuccess(newImage);

            // Increment the image count
            if (imageCount !== null) {
                setImageCount(imageCount + 1);
            }

            // Reset form
            setFile(null);
            setPreviewSrc(null);
            setWidth(800);
            setCropX(0);
            setCropY(0);
            setCropWidth(0);
            setCropHeight(0);
            setTintColor('');
            setCropPreviewVisible(false);
            setTintPreview(false);
        } catch (err) {
            console.error("Upload error:", err);
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setFile(null);
        setPreviewSrc(null);
        setWidth(800);
        setCropX(0);
        setCropY(0);
        setCropWidth(0);
        setCropHeight(0);
        setTintColor('');
        setError('');
        setCropPreviewVisible(false);
        setTintPreview(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Auto-set crop dimensions based on image
    const setAutoCrop = () => {
        if (originalImageDimensions.width > 0 && originalImageDimensions.height > 0) {
            setCropX(0);
            setCropY(0);
            setCropWidth(originalImageDimensions.width);
            setCropHeight(originalImageDimensions.height);
        }
    };

    // Set crop to center square
    const setCenterSquareCrop = () => {
        if (originalImageDimensions.width > 0 && originalImageDimensions.height > 0) {
            const size = Math.min(originalImageDimensions.width, originalImageDimensions.height);
            const x = Math.floor((originalImageDimensions.width - size) / 2);
            const y = Math.floor((originalImageDimensions.height - size) / 2);
            setCropX(x);
            setCropY(y);
            setCropWidth(size);
            setCropHeight(size);
        }
    };

    // Set crop to maintain aspect ratio with resize width
    const setResizeAspectCrop = () => {
        if (originalImageDimensions.width > 0 && originalImageDimensions.height > 0 && width > 0) {

            // Calculate what this would be on the original image
            const cropWidthOnOriginal = originalImageDimensions.width;
            const cropHeightOnOriginal = originalImageDimensions.height;

            setCropX(0);
            setCropY(0);
            setCropWidth(cropWidthOnOriginal);
            setCropHeight(cropHeightOnOriginal);
        }
    };

    // Toggle crop preview overlay
    const toggleCropPreview = () => {
        setCropPreviewVisible(!cropPreviewVisible);
    };

    // Toggle tint preview overlay
    const toggleTintPreview = () => {
        setTintPreview(!tintPreview);
    };

    return (
        <div className="glass-card p-6 mb-6 bg-gray-900 bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-xl border border-gray-800">
            <h2 className="text-xl font-semibold mb-4 text-gray-200">Upload New Image</h2>

            {/* Image count indicator */}
            <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-300">
                    {isLoadingCount ? (
                        "Loading image count..."
                    ) : (
                        imageCount !== null ? (
                            <div className="flex items-center">
                                <span>Images: </span>
                                <span className={`font-bold ml-1 ${imageCount >= IMAGE_LIMIT ? 'text-red-400' : 'text-indigo-400'}`}>
                                    {imageCount} / {IMAGE_LIMIT}
                                </span>
                                {imageCount >= IMAGE_LIMIT && (
                                    <span className="text-red-400 ml-2">
                                        (Maximum limit reached)
                                    </span>
                                )}
                            </div>
                        ) : (
                            "Unable to fetch image count"
                        )
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-900 bg-opacity-30 text-red-300 p-3 rounded-md text-sm mb-4 border border-red-700">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div
                            className={`mb-4 border-2 border-dashed rounded-lg p-6 text-center transition-all ${imageCount !== null && imageCount >= IMAGE_LIMIT
                                ? 'border-red-700 bg-red-900 bg-opacity-10 cursor-not-allowed'
                                : dragActive
                                    ? 'border-indigo-500 bg-indigo-900 bg-opacity-20'
                                    : 'border-gray-700 hover:border-gray-600'
                                }`}
                            onDragEnter={imageCount !== null && imageCount >= IMAGE_LIMIT ? undefined : handleDrag}
                            onDragOver={imageCount !== null && imageCount >= IMAGE_LIMIT ? undefined : handleDrag}
                            onDragLeave={imageCount !== null && imageCount >= IMAGE_LIMIT ? undefined : handleDrag}
                            onDrop={imageCount !== null && imageCount >= IMAGE_LIMIT ? undefined : handleDrop}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                ref={fileInputRef}
                                disabled={imageCount !== null && imageCount >= IMAGE_LIMIT}
                            />

                            <div className="flex flex-col items-center justify-center space-y-3">
                                <svg className={`w-12 h-12 ${imageCount !== null && imageCount >= IMAGE_LIMIT ? 'text-red-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                {imageCount !== null && imageCount >= IMAGE_LIMIT ? (
                                    <p className="text-red-300">
                                        You've reached the maximum limit of {IMAGE_LIMIT} images
                                    </p>
                                ) : (
                                    <p className="text-gray-300">
                                        Drag & drop an image or{' '}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-indigo-400 hover:text-indigo-300 font-medium"
                                        >
                                            browse
                                        </button>
                                    </p>
                                )}
                                <p className="text-gray-500 text-sm">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        </div>

                        {/* Only show resize width control when advanced mode is off */}
                        {!showAdvanced && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Resize Width (px)
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="range"
                                        min="100"
                                        max="2000"
                                        step="50"
                                        value={width}
                                        onChange={(e) => setWidth(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <input
                                        type="number"
                                        value={width}
                                        onChange={(e) => setWidth(parseInt(e.target.value) || 800)}
                                        min="1"
                                        className="w-20 p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 text-center"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="mb-4 mt-6">
                            <button
                                type="button"
                                className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center transition-colors"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    {showAdvanced ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                    )}
                                </svg>
                                {showAdvanced ? 'Simple Resize' : 'Advanced Options (Crop & Tint)'}
                            </button>
                        </div>

                        {showAdvanced && (
                            <div className="p-4 border border-gray-700 rounded-md mb-4 bg-gray-800 bg-opacity-50">
                                <h3 className="font-medium mb-3 text-gray-200 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    Crop Options
                                </h3>

                                <div className="flex space-x-2 mb-3">
                                    <button
                                        type="button"
                                        onClick={toggleCropPreview}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${cropPreviewVisible
                                            ? 'bg-indigo-700 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        {cropPreviewVisible ? 'Hide Overlay' : 'Show Overlay'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={setAutoCrop}
                                        className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                                    >
                                        Full Image
                                    </button>
                                    <button
                                        type="button"
                                        onClick={setCenterSquareCrop}
                                        className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                                    >
                                        Square Crop
                                    </button>
                                    <button
                                        type="button"
                                        onClick={setResizeAspectCrop}
                                        className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1 rounded-md text-xs font-medium transition-colors"
                                    >
                                        Match Resize
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">X Position</label>
                                        <input
                                            type="number"
                                            value={cropX}
                                            onChange={(e) => setCropX(parseInt(e.target.value) || 0)}
                                            min="0"
                                            max={originalImageDimensions.width}
                                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Y Position</label>
                                        <input
                                            type="number"
                                            value={cropY}
                                            onChange={(e) => setCropY(parseInt(e.target.value) || 0)}
                                            min="0"
                                            max={originalImageDimensions.height}
                                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Width (Resize Width)</label>
                                        <input
                                            type="number"
                                            value={cropWidth}
                                            onChange={(e) => setCropWidth(parseInt(e.target.value) || 0)}
                                            min="0"
                                            max={originalImageDimensions.width - cropX}
                                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">Height</label>
                                        <input
                                            type="number"
                                            value={cropHeight}
                                            onChange={(e) => setCropHeight(parseInt(e.target.value) || 0)}
                                            min="0"
                                            max={originalImageDimensions.height - cropY}
                                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
                                        />
                                    </div>
                                </div>

                                <h3 className="font-medium mb-3 mt-6 text-gray-200 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path>
                                    </svg>
                                    Tint Option
                                </h3>

                                <div className="flex space-x-2 mb-3">
                                    <button
                                        type="button"
                                        onClick={toggleTintPreview}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${tintPreview
                                            ? 'bg-indigo-700 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        {tintPreview ? 'Hide Tint Preview' : 'Show Tint Preview'}
                                    </button>
                                </div>

                                <div className="flex space-x-2">
                                    <input
                                        type="color"
                                        value={tintColor || '#6366f1'}
                                        onChange={(e) => setTintColor(e.target.value)}
                                        className="h-10 w-10 rounded border-0 bg-transparent p-0"
                                    />
                                    <input
                                        type="text"
                                        placeholder="#RRGGBB"
                                        value={tintColor}
                                        onChange={(e) => setTintColor(e.target.value)}
                                        className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Tint will be applied with 50% opacity
                                </p>
                            </div>
                        )}
                    </div>
                    <div>
                        {previewSrc ? (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Preview
                                </label>
                                <div
                                    className="border border-gray-700 rounded-md overflow-hidden bg-gray-800 h-64 flex items-center justify-center relative"
                                    ref={imageContainerRef}
                                >
                                    <img
                                        ref={imagePreviewRef}
                                        src={previewSrc}
                                        alt="Preview"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                    {cropPreviewVisible && (
                                        <div
                                            ref={cropPreviewRef}
                                            className="absolute border-2 border-indigo-500 bg-indigo-500 bg-opacity-10 pointer-events-none"
                                        ></div>
                                    )}
                                    {tintPreview && tintColor && (
                                        <div
                                            ref={tintOverlayRef}
                                            className="absolute pointer-events-none mix-blend-multiply"
                                            style={{ backgroundColor: tintColor, opacity: 0.5 }}
                                        ></div>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                    {file && (
                                        <span>
                                            {file.name} ({Math.round(file.size / 1024)} KB) •
                                            {originalImageDimensions.width && originalImageDimensions.height ?
                                                ` ${originalImageDimensions.width}×${originalImageDimensions.height}px` :
                                                ' Loading dimensions...'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="border border-gray-700 rounded-md bg-gray-800 h-64 flex items-center justify-center mb-4">
                                <p className="text-gray-500 text-sm">No image selected</p>
                            </div>
                        )}

                        <div className="mt-6 flex items-center space-x-4">
                            <button
                                type="submit"
                                disabled={isUploading || !file || (imageCount !== null && imageCount >= IMAGE_LIMIT)}
                                className={`px-4 py-2 rounded-md font-medium flex items-center ${isUploading || !file || (imageCount !== null && imageCount >= IMAGE_LIMIT)
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white transition-colors'
                                    }`}
                            >
                                {isUploading && (
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                )}
                                {isUploading ? 'Uploading...' : 'Upload Image'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md font-medium transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ImageUploader;
