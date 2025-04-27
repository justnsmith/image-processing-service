import React, { useState } from 'react';
import { ImageMeta } from '../../types';
import { deleteImage } from '../../api/api';
import { Modal } from '../ui/Modal';

interface ImageGridProps {
    images: ImageMeta[];
    isLoading: boolean;
    onImageDelete: (id: string) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ images, isLoading, onImageDelete }) => {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [expandedImageId] = useState<string | null>(null);
    const [viewImageModal, setViewImageModal] = useState<{ isOpen: boolean, image: ImageMeta | null }>({
        isOpen: false,
        image: null
    });

    const handleDeleteImage = async (id: string) => {
        try {
            setDeletingId(id);
            await deleteImage(id);
            onImageDelete(id);
        } catch (error) {
            console.error('Failed to delete image:', error);
            alert('Failed to delete image. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const openImageModal = (image: ImageMeta) => {
        setViewImageModal({
            isOpen: true,
            image
        });
    };

    const closeImageModal = () => {
        setViewImageModal({
            isOpen: false,
            image: null
        });
    };

    // Display status badge based on processing status
    const getStatusBadge = (image: ImageMeta) => {
        if (!image.processing_status) return null;

        const statusClasses = {
            pending: "bg-yellow-900 text-yellow-300",
            completed: "bg-green-900 text-green-300",
            failed: "bg-red-900 text-red-300"
        };

        const statusText = {
            pending: "Processing",
            completed: "Processed",
            failed: "Failed"
        };

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[image.processing_status]}`}>
                {statusText[image.processing_status]}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-16">
                <div className="animate-spin h-10 w-10 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
            </div>
        );
    }

    if (!images || images.length === 0) {
        return (
            <div className="glass-card p-8 text-center bg-gray-900 bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-xl border border-gray-800">
                <div className="flex flex-col items-center">
                    <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <p className="text-gray-400">You haven't uploaded any images yet.</p>
                    <p className="text-gray-500 mt-2">Start by uploading your first image above.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {images.map((image) => (
                    <div
                        key={image.id}
                        className={`glass-card overflow-hidden image-card bg-gray-900 bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-xl border border-gray-800 transition-all duration-200 ${expandedImageId === image.id ? 'ring-2 ring-indigo-500' : 'hover:ring-1 hover:ring-indigo-400'
                            }`}
                    >
                        <div
                            className="relative overflow-hidden cursor-pointer"
                            style={{ paddingBottom: '75%' }} // 4:3 aspect ratio
                            onClick={() => openImageModal(image)}
                        >
                            <img
                                src={image.url}
                                alt={image.file_name}
                                className={`absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 ${expandedImageId === image.id ? 'scale-105' : ''
                                    }`}
                            />
                            <div className="absolute top-2 right-2">
                                {getStatusBadge(image)}
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 hover:opacity-70 transition-opacity duration-300 flex items-end justify-center">
                                <div className="p-4 w-full">
                                    <button
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(image.url, '_blank');
                                        }}
                                    >
                                        View Full Size
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium text-gray-200 truncate">{image.file_name}</h3>
                            </div>

                            <div className="mt-2 text-sm text-gray-400">
                                <p>{new Date(image.uploaded).toLocaleDateString()}</p>
                                <p>{`${image.width} × ${image.height} px`}</p>
                                <p>{formatFileSize(image.size)}</p>
                            </div>

                            {image.processed_url && (
                                <div className="mt-3 border-t border-gray-700 pt-3">
                                    <p className="text-sm font-medium text-gray-300 mb-2">Processed Version:</p>
                                    <div className="relative" style={{ paddingBottom: '75%' }}>
                                        <img
                                            src={image.processed_url}
                                            alt={`Processed ${image.file_name}`}
                                            className="absolute top-0 left-0 w-full h-full object-cover rounded"
                                        />
                                    </div>
                                    <a
                                        href={image.processed_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 block text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
                                    >
                                        View Processed Image
                                    </a>
                                </div>
                            )}

                            <div className="mt-4 flex justify-between items-center">
                                <button
                                    onClick={() => openImageModal(image)}
                                    className="text-gray-300 hover:text-indigo-400 text-sm font-medium flex items-center transition-colors"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    View
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Are you sure you want to delete this image?')) {
                                            handleDeleteImage(image.id);
                                        }
                                    }}
                                    disabled={deletingId === image.id}
                                    className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center transition-colors"
                                >
                                    {deletingId === image.id ? (
                                        <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                    )}
                                    {deletingId === image.id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Image View Modal */}
            {viewImageModal.image && (
                <Modal
                    isOpen={viewImageModal.isOpen}
                    onClose={closeImageModal}
                    title={viewImageModal.image.file_name}
                    size="lg"
                >
                    <div className="flex flex-col">
                        <div className="relative mx-auto max-h-[70vh]">
                            <img
                                src={viewImageModal.image.url}
                                alt={viewImageModal.image.file_name}
                                className="object-contain max-h-[70vh] rounded-lg"
                            />
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-300">
                            <div>
                                <p className="font-semibold text-gray-200">File Name</p>
                                <p>{viewImageModal.image.file_name}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-200">Uploaded</p>
                                <p>{new Date(viewImageModal.image.uploaded).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-200">Dimensions</p>
                                <p>{`${viewImageModal.image.width} × ${viewImageModal.image.height} px`}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-200">Size</p>
                                <p>{formatFileSize(viewImageModal.image.size)}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-200">Type</p>
                                <p>{viewImageModal.image.content_type}</p>
                            </div>
                            {viewImageModal.image.processing_status && (
                                <div>
                                    <p className="font-semibold text-gray-200">Status</p>
                                    <p className="capitalize">{viewImageModal.image.processing_status}</p>
                                </div>
                            )}
                        </div>

                        {viewImageModal.image.processed_url && (
                            <div className="mt-6 border-t border-gray-700 pt-6">
                                <h3 className="text-lg font-semibold text-gray-200 mb-4">Processed Version</h3>
                                <div className="relative mx-auto max-h-[40vh]">
                                    <img
                                        src={viewImageModal.image.processed_url}
                                        alt={`Processed ${viewImageModal.image.file_name}`}
                                        className="object-contain max-h-[40vh] rounded-lg"
                                        id={`processed-img-${viewImageModal.image.id}`}
                                        onLoad={(e) => {
                                            // Get processed image dimensions when it loads
                                            const img = e.target as HTMLImageElement;
                                            const dimensionsEl = document.getElementById(`processed-dimensions-${viewImageModal.image!.id}`);
                                            if (dimensionsEl && img.naturalWidth && img.naturalHeight) {
                                                dimensionsEl.textContent = `${img.naturalWidth} × ${img.naturalHeight} px`;
                                            }
                                        }}
                                    />
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-300">
                                    <div>
                                        <p className="font-semibold text-gray-200">Dimensions</p>
                                        <p id={`processed-dimensions-${viewImageModal.image.id}`}>Loading...</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-200">Status</p>
                                        <p className="capitalize">{viewImageModal.image.processing_status}</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-center">
                                    <a
                                        href={viewImageModal.image.processed_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg transition-colors"
                                    >
                                        Open Processed Image
                                    </a>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-between">
                            <a
                                href={viewImageModal.image.url}
                                download
                                className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                </svg>
                                Download
                            </a>
                            <button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this image?')) {
                                        handleDeleteImage(viewImageModal.image!.id);
                                        closeImageModal();
                                    }
                                }}
                                className="bg-red-700 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
};

export default ImageGrid;
