// UploadResult.tsx
import React from 'react';

type UploadResultProps = {
    response: any;
};

const UploadResult: React.FC<UploadResultProps> = ({ response }) => {
    if (!response) return null;

    return (
        <div className="mt-4 p-4 border rounded-lg bg-white shadow-md">
            <pre className="text-sm text-gray-600">{JSON.stringify(response, null, 2)}</pre>
            {response.s3_url && (
                <div className="mt-4">
                    <img
                        src={response.s3_url}
                        alt="Uploaded"
                        className="max-w-full max-h-72 rounded-md shadow-lg"
                    />
                </div>
            )}
            {response.error && (
                <p className="mt-4 text-red-600 text-lg font-semibold">{response.error}</p>
            )}
        </div>
    );
};

export default UploadResult;
