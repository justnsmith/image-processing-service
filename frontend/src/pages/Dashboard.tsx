// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { ImageGrid } from '../components/dashboard/ImageGrid';
import { ImageUploader } from '../components/dashboard/ImageUploader';
import { getUserImages } from '../api/api';
import { ImageMeta } from '../types';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

const Dashboard: React.FC = () => {
    const [images, setImages] = useState<ImageMeta[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
    // We can keep this for future use or remove if not needed
    // const { user } = useAuth();

    const fetchImages = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await getUserImages();
            setImages(response.images);
        } catch (err) {
            setError('Failed to load images. Please try again later.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleImageUpload = () => {
        // Refetch images after successful upload
        fetchImages();
        // Close the modal
        setShowUploadModal(false);
    };

    return (
        <>
            <Header />
            <main className="page">
                <div className="container">
                    <div className="dashboard-header">
                        <h1>My Images</h1>
                        <Button onClick={() => setShowUploadModal(true)}>Upload New Image</Button>
                    </div>

                    {error && <div className="error">{error}</div>}

                    {/* Handling loading state in the component itself */}
                    <ImageGrid
                        images={images}
                        isLoading={isLoading}
                    />

                    <Modal
                        isOpen={showUploadModal}
                        onClose={() => setShowUploadModal(false)}
                        title="Upload Image"
                    >
                        <ImageUploader onUploadSuccess={handleImageUpload} />
                    </Modal>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default Dashboard;
