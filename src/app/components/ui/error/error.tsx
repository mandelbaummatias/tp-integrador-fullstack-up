import React from 'react'
import { Alert, AlertDescription } from '../alert';

interface ErrorProps {
  error: string | null;
}

export default function Error({ error }: ErrorProps) {
  const errorMessage = typeof error === 'string' || error === null ? error : 'Error desconocido';

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-sky-100 to-blue-50 p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
    </div>
  );
}