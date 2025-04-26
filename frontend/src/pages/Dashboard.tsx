import React, { useState, useEffect } from 'react';
import { ImageUploader } from '../components/dashboard/ImageUploader';
import { ImageGrid } from '../components/dashboard/ImageGrid';
import { getUserImages } from '../api/api';
import { ImageMeta } from '../types';

const Dashboard: React.FC = () => {
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadImages();
  }, [refreshTrigger]);

  const loadImages = async () => {
    try {
      setIsLoading(true);
      const response = await getUserImages();
      setImages(response.images);
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for when a new image is uploaded
  const handleUploadSuccess = (newImage: ImageMeta) => {
    // Add the new image to the start of the images array
    setImages([newImage, ...images]);
  };

  // Handler for when an image is deleted
  const handleImageDelete = (imageId: string) => {
    setImages(images.filter(image => image.id !== imageId));
  };

  // Function to refresh images from the server
  const refreshImages = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Dashboard</h1>
        <button
          onClick={refreshImages}
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          Refresh
        </button>
      </div>

      <ImageUploader onUploadSuccess={handleUploadSuccess} />

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Images</h2>
          <span className="text-sm text-gray-500">{images.length} image{images.length !== 1 ? 's' : ''}</span>
        </div>
        <ImageGrid
          images={images}
          isLoading={isLoading}
          onImageDelete={handleImageDelete}
        />
      </div>
    </div>
  );
};

export default Dashboard;
