import React from 'react'

export default function Skeleton() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-sky-100 to-blue-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 rounded-full bg-blue-300 mb-4"></div>
        <div className="h-4 w-48 bg-blue-300 rounded"></div>
      </div>
    </div>
  );

}
