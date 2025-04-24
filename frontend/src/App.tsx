import { useState } from 'react';

function App() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [response, setResponse] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async (file) => {
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
        <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <h1>Image Upload</h1>
            <input type="file" onChange={handleFileChange} />
            <button onClick={() => handleUpload(file)} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
            </button>
            {response && (
                <div style={{ marginTop: '1rem' }}>
                    {/* Show the response */}
                    <pre>{JSON.stringify(response, null, 2)}</pre>

                    {/* Conditionally render the image if the URL exists */}
                    {response.s3_url ? (
                        <img
                            src={response.s3_url}
                            alt="Uploaded"
                            style={{ maxWidth: '300px', marginTop: '1rem' }}
                        />
                    ) : (
                        <p>Image failed to load or URL is missing.</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default App;
