import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { uploadImage } from '../../api/api';

interface ImageUploaderProps {
  onUploadSuccess: () => void;
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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
      const params: any = { width };

      if (showAdvanced) {
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

      await uploadImage(file, params);
      setFile(null);
      onUploadSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Upload New Image</h2>
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

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

        <Input
          label="Resize Width (px)"
          type="number"
          value={width.toString()}
          onChange={(e) => setWidth(parseInt(e.target.value) || 800)}
          min="1"
        />

        <div className="mb-4">
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
              <Input
                label="X Position"
                type="number"
                value={cropX.toString()}
                onChange={(e) => setCropX(parseInt(e.target.value) || 0)}
                min="0"
              />
              <Input
                label="Y Position"
                type="number"
                value={cropY.toString()}
                onChange={(e) => setCropY(parseInt(e.target.value) || 0)}
                min="0"
              />
              <Input
                label="Width"
                type="number"
                value={cropWidth.toString()}
                onChange={(e) => setCropWidth(parseInt(e.target.value) || 0)}
                min="0"
              />
              <Input
                label="Height"
                type="number"
                value={cropHeight.toString()}
                onChange={(e) => setCropHeight(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>

            <h3 className="font-medium mt-4 mb-2">Color Options</h3>
            <Input
              label="Tint Color (hex)"
              type="text"
              placeholder="#RRGGBB"
              value={tintColor}
              onChange={(e) => setTintColor(e.target.value)}
            />
          </div>
        )}

        <Button
          type="submit"
          isLoading={isUploading}
          disabled={!file}
          className="w-full"
        >
          Upload Image
        </Button>
      </form>
    </div>
  );
};
