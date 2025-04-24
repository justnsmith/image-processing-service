import { useState } from 'react';

type DropZoneProps = {
  onFileAccepted: (file: File) => void;
  onError: (message: string) => void;
};

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export default function DropZone({ onFileAccepted, onError }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      onError('Only JPG, PNG, and GIF images are allowed.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      onError(`File must be smaller than ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    onFileAccepted(file);
  };

  return (
    <div
      className={`border-2 border-dashed p-6 rounded-lg text-center transition-all ${
        dragging ? 'bg-blue-100 border-blue-500' : 'bg-white'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <p className="text-gray-600">
        {dragging ? 'Drop it here!' : 'Drag and drop an image here, or use the file picker.'}
      </p>
    </div>
  );
}
