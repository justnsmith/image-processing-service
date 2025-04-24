import { useState } from 'react';
import DropZone from './components/DropZone';
import ErrorMessage from './components/ErrorMessage';
import ProgressBar from './components/ProgressBar';

function App() {
  const [, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileAccepted = (file: File) => {
    setFile(file);
    setError(null);
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setProgress(0);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://localhost:8080/upload', true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setProgress(percent);
        }
      };

      xhr.onload = () => {
        const res = JSON.parse(xhr.responseText);
        setResponse(res);
        setUploading(false);
      };

      xhr.onerror = () => {
        setError("Upload failed due to a network error.");
        setUploading(false);
      };

      xhr.send(formData);
    } catch (err: any) {
      console.error(err);
      setError("Something went wrong.");
      setUploading(false);
    }
  };

  return (
    <div className="p-8 font-sans max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">📤 Image Uploader</h1>

      <DropZone onFileAccepted={handleFileAccepted} onError={setError} />

      {uploading && <ProgressBar progress={progress} />}
      {error && <ErrorMessage message={error} />}

      {response?.s3_url && (
        <div className="mt-6 text-center">
          <img
            src={response.s3_url}
            alt="Uploaded"
            className="max-w-full max-h-96 rounded border mt-4"
          />
          <p className="text-green-700 mt-2">Upload successful!</p>
        </div>
      )}
    </div>
  );
}

export default App;
