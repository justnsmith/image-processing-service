// App.tsx
import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import UploadResult from './components/UploadResult';

const App: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [response, setResponse] = useState<any>(null);

    const handleFileSelect = (file: File) => {
        setFile(file);
    };

    const handleUpload = async () => {
        if (!file) {
            console.error("No file selected.");
            return;
        }

        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:8080/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            setResponse(data);

            if (res.ok) {
                console.log("Upload succeeded", data);
            } else {
                console.error("Upload failed", data);
            }
        } catch (err) {
            console.error("Request failed", err);
            setResponse({ error: "Request failed" });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-6">Image Upload</h1>
            <div className="w-full max-w-lg">
                <FileUpload onFileSelect={handleFileSelect} isUploading={uploading} onUpload={handleUpload} />
                <UploadResult response={response} />
            </div>
        </div>
    );
};

export default App;
