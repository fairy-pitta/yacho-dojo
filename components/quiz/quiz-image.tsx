'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, ZoomIn } from 'lucide-react';

interface QuizImageProps {
  imageUrl: string;
  alt?: string;
  credit?: string;
}

export function QuizImage({ imageUrl, alt = '問題画像', credit }: QuizImageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="space-y-2">
        <div 
          className="relative w-full h-64 rounded-lg overflow-hidden cursor-pointer group border-2 border-primary/20 hover:border-primary/40 transition-colors shadow-md"
          onClick={() => setIsModalOpen(true)}
        >
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
            <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {credit && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <p className="text-white text-xs text-right opacity-80">
                {credit}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* 画像拡大モーダル */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-primary/20 hover:bg-primary/30 rounded-full p-2 transition-all border border-white/20"
            >
              <X className="h-6 w-6 text-white" />
            </button>
            <div className="relative w-full h-full border border-white/20 rounded-lg overflow-hidden">
              <Image
                src={imageUrl}
                alt={`${alt}（拡大）`}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}