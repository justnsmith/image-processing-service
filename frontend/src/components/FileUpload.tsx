// FileUpload.tsx
import React, { useState } from 'react';

type FileUploadProps = {
    onFileSelect: (file: File) => void;
    isUploading: boolean;
    onUpload: () => void;
};

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isUploading, onUpload }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            onFileSelect(droppedFile);
            onUpload();
        }
    };

    return (
        <div
            className={`border-4 border-dashed p-12 rounded-lg text-center transition-all duration-300
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-100'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        onFileSelect(file);
                        onUpload();
                    }
                }}
            />
            <p className="text-lg text-gray-700">
                {isUploading
                    ? 'Uploading...'
                    : isDragging
                    ? 'Release to upload your image!'
                    : 'Drag and drop an image here, or click to select one.'}
            </p>
        </div>
    );
};

export default FileUpload;
