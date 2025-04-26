import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { uploadImage } from '../../api/api';

interface ImageUploaderProps {
  onUploadSuccess: (newImage: any) => void;
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

      // Create preview
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
      // Determine if we're applying modifications
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

      const response = await uploadImage(file, params);

      // Create an image metadata object from the response
      const newImage = {
        id: response.stored_key,
        file_name: file.name,
        url: response.s3_url,
        size: file.size,
        uploaded: new Date().toISOString(),
        width: response.width,
        height: response.height,
        content_type: file.type
      };

      // Pass the new image to the parent component
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

            <Input
              label="Resize Width (px)"
              type="number"
              value={width.toString()}
              onChange={(e) => setWidth(parseInt(e.target.value) || 800)}
              min="1"
            />

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
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            type="submit"
            isLoading={isUploading}
            disabled={!file}
            className="flex-1"
          >
            {showAdvanced || width !== 800 ? 'Upload & Process Image' : 'Upload Original Image'}
          </Button>

          <Button
            type="button"
            onClick={resetForm}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800"
          >
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
};
