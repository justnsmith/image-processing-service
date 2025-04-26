import React, { useState } from 'react';
import { uploadImage } from '../../api/api';
import { ImageMeta } from '../../types';

interface ImageUploaderProps {
    onUploadSuccess: (newImage: ImageMeta) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onUploadSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [width, setWidth] = useState<number>(800);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [cropX, setCropX] = useState<number>(0);
    const [cropY, setCropY] = useState<number>(0);
    const [cropWidth, setCropWidth] = useState<number>(0);
    const [cropHeight, setCropHeight] = useState<number>(0);
    const [tintColor, setTintColor] = useState('');
    const [previewSrc, setPreviewSrc] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);

            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviewSrc(e.target?.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setError('Please select a file to upload');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            console.log("Starting upload...");
            const applyModifications = showAdvanced || width !== 800;

            // Only send parameters if we're modifying the image
            const params: any = applyModifications ? { width } : {};

            if (showAdvanced && applyModifications) {
                if (cropWidth > 0 && cropHeight > 0) {
                    params.cropX = cropX;
                    params.cropY = cropY;
                    params.cropWidth = cropWidth;
                    params.cropHeight = cropHeight;
                }

                if (tintColor) {
                    params.tintColor = tintColor;
                }
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
                processing_status: applyModifications ? 'pending' : undefined
            };

            console.log("Created new image metadata:", newImage);
            onUploadSuccess(newImage);

            // Reset form
            setFile(null);
            setPreviewSrc(null);
            setWidth(800);
            setCropX(0);
            setCropY(0);
            setCropWidth(0);
            setCropHeight(0);
            setTintColor('');
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
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Upload New Image</h2>
            <form onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm mb-4">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Image
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Resize Width (px)
                            </label>
                            <input
                                type="number"
                                value={width}
                                onChange={(e) => setWidth(parseInt(e.target.value) || 800)}
                                min="1"
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="mb-4 mt-4">
                            <button
                                type="button"
                                className="text-blue-600 text-sm flex items-center"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                            >
                                {showAdvanced ? '- Hide' : '+ Show'} Advanced Options
                            </button>
                        </div>

                        {showAdvanced && (
                            <div className="p-4 border border-gray-200 rounded-md mb-4">
                                <h3 className="font-medium mb-2">Crop Options</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">X Position</label>
                                        <input
                                            type="number"
                                            value={cropX}
                                            onChange={(e) => setCropX(parseInt(e.target.value) || 0)}
                                            min="0"
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Y Position</label>
                                        <input
                                            type="number"
                                            value={cropY}
                                            onChange={(e) => setCropY(parseInt(e.target.value) || 0)}
                                            min="0"
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                                        <input
                                            type="number"
                                            value={cropWidth}
                                            onChange={(e) => setCropWidth(parseInt(e.target.value) || 0)}
                                            min="0"
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                                        <input
                                            type="number"
                                            value={cropHeight}
                                            onChange={(e) => setCropHeight(parseInt(e.target.value) || 0)}
                                            min="0"
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>

                                <h3 className="font-medium mt-4 mb-2">Color Options</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tint Color (hex)</label>
                                    <input
                                        type="text"
                                        placeholder="#RRGGBB"
                                        value={tintColor}
                                        onChange={(e) => setTintColor(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        {previewSrc && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Preview
                                </label>
                                <div className="border border-gray-200 rounded-md overflow-hidden bg-gray-50 h-64 flex items-center justify-center">
                                    <img
                                        src={previewSrc}
                                        alt="Preview"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                                <p className="mt-2 text-sm text-gray-500">
                                    {showAdvanced || width !== 800
                                        ? "This image will be processed according to your specifications."
                                        : "The original image will be uploaded without modifications."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        type="submit"
                        disabled={!file || isUploading}
                        className={`flex-1 py-2 px-4 rounded-md ${isUploading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium`}
                    >
                        {isUploading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                            </span>
                        ) : (
                            <span>
                                {showAdvanced || width !== 800 ? 'Upload & Process Image' : 'Upload Original Image'}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={resetForm}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md font-medium"
                    >
                        Reset
                    </button>
                </div>
            </form>
        </div>
    );
}
