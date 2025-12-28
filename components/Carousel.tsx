
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Gallery, Photo } from '../types';
import { getGalleryCommentary } from '../services/geminiService';

interface CarouselProps {
  gallery: Gallery;
  onClose: () => void;
}

const Carousel: React.FC<CarouselProps> = ({ gallery, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [commentary, setCommentary] = useState<string>('Loading poetic thoughts...');
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCommentary = async () => {
      const text = await getGalleryCommentary(gallery.title, gallery.subtitle);
      setCommentary(text);
    };
    fetchCommentary();
  }, [gallery]);

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  const resetZoom = useCallback(() => {
    setIsZoomed(false);
    setMousePos({ x: 50, y: 50 });
  }, []);

  const goToNext = useCallback(() => {
    resetZoom();
    setCurrentIndex((prev) => (prev + 1) % gallery.photos.length);
  }, [gallery.photos.length, resetZoom]);

  const goToPrev = useCallback(() => {
    resetZoom();
    setCurrentIndex((prev) => (prev - 1 + gallery.photos.length) % gallery.photos.length);
  }, [gallery.photos.length, resetZoom]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isZoomed || !containerRef.current) return;
    
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setMousePos({ x, y });
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'Escape') onClose();
      if (e.key === ' ' || e.key === 'z') {
        e.preventDefault();
        toggleZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose, isZoomed]);

  // Sync scroll position for indicator strip
  useEffect(() => {
    if (scrollRef.current) {
      const activeItem = scrollRef.current.children[currentIndex] as HTMLElement;
      if (activeItem) {
        scrollRef.current.scrollTo({
          left: activeItem.offsetLeft - scrollRef.current.offsetWidth / 2 + activeItem.offsetWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [currentIndex]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/98 flex flex-col items-center justify-center p-4 md:p-10 animate-in fade-in duration-500 overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 w-full flex justify-between items-start p-6 md:px-12 z-[110] pointer-events-none">
        <div className="flex flex-col">
          <h2 className="text-xl md:text-3xl font-light tracking-tight text-white">
            {gallery.title} <span className="serif italic text-cyan-400 ml-2">{gallery.subtitle}</span>
          </h2>
          <p className="text-xs md:text-sm text-gray-400 tracking-wide mt-1 hidden md:block max-w-xl italic">
            {commentary}
          </p>
        </div>
        <div className="flex items-center space-x-2 pointer-events-auto">
          {/* Zoom Toggle Button */}
          <button 
            onClick={toggleZoom}
            className={`p-3 rounded-full transition-all duration-300 ${isZoomed ? 'bg-cyan-500 text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
            title={isZoomed ? "Zoom Out (Z)" : "Zoom In (Z)"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              {isZoomed ? (
                <line x1="8" y1="11" x2="14" y2="11"></line>
              ) : (
                <>
                  <line x1="12" y1="8" x2="12" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </>
              )}
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
          
          <button 
            onClick={onClose}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
            title="Close (Esc)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className={`relative w-full max-w-7xl h-[60vh] md:h-[70vh] flex items-center justify-center group overflow-hidden transition-all duration-500 ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
        onClick={toggleZoom}
      >
        {/* Navigation Buttons (Hidden when zoomed for clean exploration) */}
        {!isZoomed && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); goToPrev(); }}
              className="absolute left-4 z-10 p-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover:translate-x-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 z-10 p-4 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </>
        )}
        
        <div className="w-full h-full relative flex items-center justify-center pointer-events-none">
           {gallery.photos.map((photo, idx) => (
             <div 
               key={photo.id}
               className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${
                 idx === currentIndex ? 'opacity-100' : 'opacity-0'
               }`}
             >
                <img 
                  src={photo.url} 
                  alt={photo.alt}
                  style={{
                    transform: isZoomed 
                      ? `scale(2.5)` 
                      : `scale(1)`,
                    transformOrigin: isZoomed 
                      ? `${mousePos.x}% ${mousePos.y}%` 
                      : 'center center',
                  }}
                  className="w-full h-full object-contain transition-transform duration-200 ease-out"
                />
             </div>
           ))}
        </div>
      </div>

      {/* Thumbnails / Indicators */}
      <div className={`absolute bottom-6 w-full max-w-4xl px-4 transition-all duration-500 ${isZoomed ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div 
          ref={scrollRef}
          className="flex space-x-3 overflow-x-auto no-scrollbar py-4 px-2"
        >
          {gallery.photos.map((photo, idx) => (
            <button
              key={photo.id}
              onClick={() => setCurrentIndex(idx)}
              className={`flex-shrink-0 relative w-16 h-12 md:w-24 md:h-16 rounded-lg overflow-hidden transition-all duration-300 ${
                idx === currentIndex ? 'ring-2 ring-cyan-500 scale-110 shadow-lg shadow-cyan-500/20' : 'opacity-40 hover:opacity-100 scale-100'
              }`}
            >
              <img src={photo.url} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        <div className="text-center mt-2 text-[10px] tracking-[0.4em] text-gray-600 uppercase">
          {currentIndex + 1} / {gallery.photos.length} — Click image or press Z to explore details
        </div>
      </div>
    </div>
  );
};

export default Carousel;
