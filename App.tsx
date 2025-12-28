
import React, { useState, useEffect } from 'react';
import { Gallery, Photo } from './types';
import Carousel from './components/Carousel';

const App: React.FC = () => {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Converts standard Drive view links to high-quality thumbnail/stream links
  const transformDriveUrl = (url: string): string => {
    if (!url.includes('drive.google.com')) return url;
    // Extract ID from /file/d/[ID]/view or ?id=[ID]
    const idMatch = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&/]+)/);
    if (idMatch && idMatch[1]) {
      // sz=w1600 provides high resolution for both the grid and carousel
      return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1600`;
    }
    return url;
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadDynamicGalleries = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fileId = '13Ls_10OGXOPa3ZOJdDrqf1HmagjfzUG-';
        const directUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
        // Use allorigins to bypass CORS for the text file
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Source file could not be fetched.');
        
        const text = await response.text();
        
        // Safety check: sometimes Drive returns a HTML confirmation page for large files
        if (text.includes('<!DOCTYPE html>')) {
           throw new Error('Received HTML instead of text. The file might be restricted or require a virus scan bypass.');
        }

        const lines = text.split(/\r?\n/);
        const albumMap: Record<string, Photo[]> = {};
        
        /**
         * Parsing Logic based on the provided format:
         * [AlbumName] FileName : URL
         * Example: [Lisboa] DSC05061.JPG : https://...
         */
        const regex = /\[\s*(.*?)\s*\]\s*.*?\s*:\s*(https?:\/\/\S+)/i;
        
        lines.forEach((line, index) => {
          const match = line.trim().match(regex);
          if (match) {
            const albumName = match[1].trim();
            const rawUrl = match[2].trim();
            const photoUrl = transformDriveUrl(rawUrl);
            
            if (!albumMap[albumName]) {
              albumMap[albumName] = [];
            }
            
            albumMap[albumName].push({
              id: `photo-${index}`,
              url: photoUrl,
              alt: `${albumName} photography piece ${albumMap[albumName].length + 1}`
            });
          }
        });

        const albumEntries = Object.entries(albumMap);
        if (albumEntries.length === 0) {
          console.warn("Parsing resulted in 0 albums. Raw text sample:", text.substring(0, 200));
          throw new Error('No valid albums found. Please check if the file format matches [AlbumName] FileName : URL');
        }

        // Convert the map to our Gallery format
        const dynamicGalleries: Gallery[] = albumEntries.map(([name, photos]) => ({
          id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          title: name,
          subtitle: `${photos.length} captures`,
          coverImage: photos[0].url,
          description: `Exploring the essence of ${name} through high-resolution photography.`,
          photos: photos
        }));

        setGalleries(dynamicGalleries);
      } catch (err: any) {
        console.error("Gallery Sync Error:", err);
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDynamicGalleries();
  }, []);

  return (
    <div className="min-h-screen text-slate-200">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 flex justify-between items-center px-8 py-6 transition-all duration-500 ${scrolled ? 'bg-[#011627]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl' : 'mix-blend-difference'}`}>
        <div className="text-xl font-semibold tracking-tighter text-white">SALTY ESSENCE</div>
        <div className="space-x-8 text-sm uppercase tracking-[0.2em] hidden md:flex text-white">
          <button className="hover:text-cyan-400 transition" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>Portfolio</button>
          <a href="#" className="hover:text-cyan-400 transition">Contact</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="h-[50vh] flex flex-col justify-center items-center text-center px-4 relative pt-20">
        <div className="relative z-10">
          <h1 className="text-6xl md:text-8xl font-light tracking-tighter animate-in slide-in-from-bottom-12 duration-1000 text-white">
            Visual <span className="serif italic text-cyan-400">Archives</span>
          </h1>
          <p className="mt-6 text-cyan-100/30 tracking-[0.5em] uppercase text-[10px] animate-in fade-in duration-1000 delay-300">
            Dynamically Curated Galleries
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-32">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-8">
            <div className="w-10 h-10 border-2 border-cyan-500/10 border-t-cyan-400 rounded-full animate-spin"></div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-400/60 animate-pulse">Parsing Remote Library</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-40 text-center max-w-lg mx-auto bg-white/5 rounded-3xl p-12 border border-white/5">
            <div className="text-red-400/40 mb-6 scale-125">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h2 className="text-2xl font-light mb-4 text-white">Connection Interrupted</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-10">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-12 py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[10px] tracking-[0.3em] uppercase transition-all text-cyan-400 rounded-full"
            >
              Try Reconnecting
            </button>
          </div>
        ) : (
          <div className="masonry">
            {galleries.map((gallery, index) => (
              <div 
                key={gallery.id} 
                className="gallery-item group animate-in fade-in slide-in-from-bottom-8 duration-1000 mb-8 break-inside-avoid"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
                onClick={() => setSelectedGallery(gallery)}
              >
                <div className="relative overflow-hidden rounded-2xl bg-slate-900 group cursor-pointer shadow-2xl transition-all duration-700 border border-white/5">
                  <div className="aspect-[3/4] overflow-hidden">
                    <img 
                      src={gallery.coverImage} 
                      alt={gallery.title} 
                      className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 opacity-0 filter saturate-[0.7] group-hover:saturate-100"
                      onLoad={(e) => {
                        (e.currentTarget as HTMLImageElement).classList.remove('opacity-0');
                        (e.currentTarget as HTMLImageElement).classList.add('opacity-100');
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#011627] via-[#011627]/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-end p-8 text-center">
                    <span className="text-[9px] tracking-[0.5em] uppercase text-cyan-400 mb-2">{gallery.photos.length} Pieces</span>
                    <h3 className="text-3xl font-light tracking-tight mb-4 serif italic text-white">{gallery.title}</h3>
                    <div className="h-px w-12 bg-cyan-400/50 group-hover:w-20 transition-all duration-700"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 py-32 text-center opacity-20">
        <p className="text-[10px] tracking-[0.6em] uppercase">
          Dynamic Portfolio System &bull; 2025
        </p>
      </footer>

      {/* Modal Carousel */}
      {selectedGallery && (
        <Carousel 
          gallery={selectedGallery} 
          onClose={() => setSelectedGallery(null)} 
        />
      )}
    </div>
  );
};

export default App;
