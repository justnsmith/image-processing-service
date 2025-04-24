type ErrorMessageProps = {
    message: string;
  };

  export default function ErrorMessage({ message }: ErrorMessageProps) {
    return (
      <div className="text-red-600 bg-red-100 border border-red-300 p-3 rounded mt-4">
        {message}
      </div>
    );
  }
