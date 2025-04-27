import React, { useState, useEffect } from 'react';
import { getUserImages, getImageStatus } from '../api/api';
import { ImageUploader } from '../components/dashboard/ImageUploader';
import { ImageGrid } from '../components/dashboard/ImageGrid';
import { ImageMeta } from '../types';
import { Header } from '../components/layout/Header';

const Dashboard: React.FC = () => {
    const [images, setImages] = useState<ImageMeta[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load initial images
    useEffect(() => {
        const fetchImages = async () => {
            try {
                setIsLoading(true);
                const response = await getUserImages();
                setImages(response.images || []);
            } catch (error) {
                console.error('Failed to fetch images:', error);
                setImages([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchImages();
    }, []);

    // Set up polling for pending images
    useEffect(() => {
        if (!images || images.length === 0) {
            return;
        }

        const pendingImages = images.filter(img => img.processing_status === 'pending');

        if (pendingImages.length === 0) {
            return;
        }

        console.log("Pending images found:", pendingImages.length);

        const intervalId = window.setInterval(async () => {
            for (const image of pendingImages) {
                try {
                    // Use image.id consistently
                    const status = await getImageStatus(image.id);

                    if (status.status === 'completed' || status.status === 'failed') {
                        setImages(prevImages =>
                            prevImages.map(img =>
                                img.id === image.id
                                    ? {
                                        ...img,
                                        processing_status: status.status as 'completed' | 'failed',
                                        processed_url: status.processed_url
                                    } as ImageMeta
                                    : img
                            )
                        );
                    }
                } catch (error) {
                    console.error(`Failed to check status for image ${image.id}:`, error);
                }
            }
        }, 3000);

        return () => {
            clearInterval(intervalId);
        };
    }, [images]);

    const handleImageUpload = async (newImage: ImageMeta) => {
        console.log("New image uploaded:", newImage);
        setImages(prev => [newImage, ...(prev || [])]);

        // If this is a processed image, start checking status immediately
        if (newImage.processing_status === 'pending') {
            console.log("Starting immediate status check for new image");
            // Begin checking status immediately
            const checkStatus = async () => {
                try {
                    const status = await getImageStatus(newImage.id);
                    if (status.status === 'completed' || status.status === 'failed') {
                        setImages(prev =>
                            (prev || []).map(img =>
                                img.id === newImage.id
                                    ? { ...img, processing_status: status.status, processed_url: status.processed_url } as ImageMeta
                                    : img
                            )
                        );
                        return true; // Status updated
                    }
                    return false; // Still pending
                } catch (error) {
                    console.error("Error checking image status:", error);
                    return false;
                }
            };

            const quickCheck = async () => {
                for (let i = 0; i < 5; i++) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    const done = await checkStatus();
                    if (done) break;
                }
            };

            quickCheck();
        }
    };

    const handleImageDelete = (id: string) => {
        setImages(prev => (prev || []).filter(img => img.id !== id));
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex-grow p-8 bg-card-dark">
                <h1 className="text-3xl font-bold mb-8 text-gray-200">Image Dashboard</h1>

                <ImageUploader onUploadSuccess={handleImageUpload} />

                <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4 text-gray-200">Your Images</h2>
                    <ImageGrid
                        images={images || []}
                        isLoading={isLoading}
                        onImageDelete={handleImageDelete}
                    />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
