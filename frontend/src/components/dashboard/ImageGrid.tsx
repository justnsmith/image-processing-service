import React from 'react';
import { ImageMeta } from '../../types';

interface ImageGridProps {
  images: ImageMeta[];
  isLoading: boolean;
}

export const ImageGrid: React.FC<ImageGridProps> = ({ images, isLoading }) => {
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

  if (images.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <p className="text-gray-500">You haven't uploaded any images yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {images.map((image) => (
        <div key={image.id} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="aspect-w-4 aspect-h-3 bg-gray-100">
            <img
              src={image.url}
              alt={image.file_name}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="p-4">
            <h3 className="font-medium text-gray-800 truncate">{image.file_name}</h3>
            <div className="mt-2 text-sm text-gray-500">
              <p>{new Date(image.uploaded).toLocaleDateString()}</p>
              <p>{`${image.width} × ${image.height} px`}</p>
              <p>{formatFileSize(image.size)}</p>
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
