import React, { useState } from 'react';
import { ImageMeta } from '../../types';
import { deleteImage } from '../../api/api';

interface ImageGridProps {
  images: ImageMeta[];
  isLoading: boolean;
  onImageDelete: (id: string) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ images, isLoading, onImageDelete }) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedImageId, setExpandedImageId] = useState<string | null>(null);

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

  const toggleImageExpansion = (id: string) => {
    if (expandedImageId === id) {
      setExpandedImageId(null);
    } else {
      setExpandedImageId(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <p className="text-gray-500">You haven't uploaded any images yet.</p>
        </div>
      </div>
    );
  }

  // Display status badge based on processing status
  const getStatusBadge = (image: ImageMeta) => {
    if (!image.processing_status) return null;

    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800"
    };

    const statusText = {
      pending: "Processing",
      completed: "Processed",
      failed: "Failed"
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[image.processing_status]}`}>
        {statusText[image.processing_status]}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {images.map((image) => (
        <div
          key={image.id}
          className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 ${
            expandedImageId === image.id ? 'ring-2 ring-blue-500' : 'hover:shadow-lg'
          }`}
        >
          <div
            className="relative overflow-hidden cursor-pointer"
            style={{ paddingBottom: '75%' }} // 4:3 aspect ratio
            onClick={() => toggleImageExpansion(image.id)}
          >
            <img
              src={image.url}
              alt={image.file_name}
              className={`absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 ${
                expandedImageId === image.id ? 'scale-110' : ''
              }`}
            />
            {expandedImageId === image.id && (
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(image.url, '_blank');
                  }}
                  className="bg-white text-gray-800 py-1 px-3 rounded-full text-sm font-medium hover:bg-opacity-90"
                >
                  View Full Size
                </button>
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-800 truncate">{image.file_name}</h3>
              {getStatusBadge(image)}
            </div>

            <div className="mt-2 text-sm text-gray-500">
              <p>{new Date(image.uploaded).toLocaleDateString()}</p>
              <p>{`${image.width} × ${image.height} px`}</p>
              <p>{formatFileSize(image.size)}</p>
            </div>

            {image.processed_url && (
              <div className="mt-3 border-t pt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Processed Version:</p>
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
                  className="mt-2 block text-blue-600 text-sm"
                >
                  View Processed Image
                </a>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Are you sure you want to delete this image?')) {
                    handleDeleteImage(image.id);
                  }
                }}
                disabled={deletingId === image.id}
                className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
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
  );
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};
