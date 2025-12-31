
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import Carousel from './components/Carousel.js';

const html = htm.bind(React.createElement);

const App = () => {
  const [galleries, setGalleries] = useState([]);
  const [selectedGallery, setSelectedGallery] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const transformDriveUrl = (url) => {
    if (!url.includes('drive.google.com')) return url;
    const idMatch = url.match(/\/d\/([^/]+)/) || url.match(/id=([^&/]+)/);
    if (idMatch && idMatch[1]) {
      return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1600`;
    }
    return url;
  };

  const parseGalleryText = (text) => {
    const lines = text.split(/\r?\n/);
    const albumMap = {};
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
    if (albumEntries.length === 0) return null;

    return albumEntries.map(([name, photos]) => ({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: name,
      subtitle: `${photos.length} captures`,
      coverImage: photos[0].url,
      description: `Exploring the essence of ${name} through high-resolution photography.`,
      photos: photos
    }));
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
      
      let fetchedText = null;
      let dataSource = 'remote';

      try {
        // Attempt 1: Remote Google Drive via Proxy
        const fileId = '13Ls_10OGXOPa3ZOJdDrqf1HmagjfzUG-';
        const directUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(directUrl)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Remote source unavailable.');
        
        const text = await response.text();
        if (text.includes('<!DOCTYPE html>')) {
           throw new Error('Remote source returned HTML instead of raw text.');
        }
        fetchedText = text;
      } catch (remoteErr) {
        console.warn("Remote Gallery Sync Failed, attempting local fallback:", remoteErr.message);
        
        try {
          // Attempt 2: Local Fallback
          const localResponse = await fetch('./File_URL_List.txt');
          if (!localResponse.ok) throw new Error('Local fallback file not found.');
          fetchedText = await localResponse.text();
          dataSource = 'local';
        } catch (localErr) {
          console.error("All data sources failed.");
          setError('Could not establish connection to image library (Remote & Local sources failed).');
          setIsLoading(false);
          return;
        }
      }

      const parsedGalleries = parseGalleryText(fetchedText);
      if (!parsedGalleries) {
        setError('The library file was found but contained no valid gallery entries.');
      } else {
        setGalleries(parsedGalleries);
        console.log(`Successfully loaded ${parsedGalleries.length} galleries from ${dataSource} source.`);
      }
      
      setIsLoading(false);
    };

    loadDynamicGalleries();
  }, []);

  return html`
    <div className="min-h-screen text-slate-200">
      ${!selectedGallery && html`
        <nav className=${`fixed top-0 w-full z-50 flex justify-end items-center px-8 py-6 transition-all duration-500 ${scrolled ? 'bg-[#011627]/95 backdrop-blur-xl border-b border-white/5 shadow-2xl' : 'mix-blend-difference'}`}>
          <div className="text-sm uppercase tracking-[0.2em] hidden md:flex text-white">
            <a href="mailto:example@example.com" className="hover:text-cyan-400 transition">Contact</a>
          </div>
        </nav>

        <section className="h-[75vh] flex flex-col justify-center items-center text-center px-4 relative pt-20">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-52 h-32 md:w-72 md:h-44 rounded-full border border-cyan-400/30 p-1 mb-10 shadow-[0_0_50px_rgba(34,211,238,0.2)] animate-in fade-in zoom-in duration-1000 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&w=600&q=80" 
                alt="Photographer" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 scale-[1.05] hover:scale-110"
              />
            </div>
            <h1 className="text-6xl md:text-8xl font-light tracking-tighter animate-in slide-in-from-bottom-12 duration-1000 text-white">
              Visual <span className="serif italic text-cyan-400">Archives</span>
            </h1>
            <p className="mt-6 text-cyan-100/30 tracking-[0.5em] uppercase text-[10px] animate-in fade-in duration-1000 delay-300">
              Dynamically Curated Galleries
            </p>
          </div>
        </section>

        <main className="w-full px-6 md:px-12 pb-32">
          ${isLoading ? html`
            <div className="flex flex-col items-center justify-center py-40 space-y-8">
              <div className="w-10 h-10 border-2 border-cyan-500/10 border-t-cyan-400 rounded-full animate-spin"></div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-400/60 animate-pulse">Syncing Visual Library</p>
            </div>
          ` : error ? html`
            <div className="flex flex-col items-center justify-center py-40 text-center max-w-lg mx-auto bg-white/5 rounded-3xl p-12 border border-white/5">
              <div className="text-red-400/40 mb-6 scale-125">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h2 className="text-2xl font-light mb-4 text-white">Connection Interrupted</h2>
              <p className="text-sm text-slate-400 leading-relaxed mb-10">${error}</p>
              <button 
                onClick=${() => window.location.reload()}
                className="px-12 py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[10px] tracking-[0.3em] uppercase transition-all text-cyan-400 rounded-full"
              >
                Try Reconnecting
              </button>
            </div>
          ` : html`
            <div className="gallery-grid">
              ${galleries.map((gallery, index) => html`
                <div 
                  key=${gallery.id} 
                  className="group animate-in fade-in slide-in-from-bottom-8 duration-1000"
                  style=${{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
                  onClick=${() => setSelectedGallery(gallery)}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-slate-900 group cursor-pointer shadow-2xl transition-all duration-700 border border-white/5">
                    <div className="aspect-[3/4] overflow-hidden">
                      <img 
                        src=${gallery.coverImage} 
                        alt=${gallery.title} 
                        className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 opacity-0 filter saturate-[0.7] group-hover:saturate-100"
                        onLoad=${(e) => {
                          e.currentTarget.classList.remove('opacity-0');
                          e.currentTarget.classList.add('opacity-100');
                        }}
                        onError=${(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#011627] via-[#011627]/40 to-transparent flex flex-col items-center justify-end p-8 text-center transition-all duration-500">
                      <span className="text-[9px] tracking-[0.5em] uppercase text-cyan-400 mb-2">${gallery.photos.length} Pieces</span>
                      <h3 className="text-3xl font-light tracking-tight mb-4 serif italic text-white">${gallery.title}</h3>
                      <div className="h-px w-12 bg-cyan-400/50 group-hover:w-20 transition-all duration-700"></div>
                    </div>
                  </div>
                </div>
              `)}
            </div>
          `}
        </main>

        <footer className="border-t border-white/5 py-32 text-center opacity-20">
          <p className="text-[10px] tracking-[0.6em] uppercase">
            All Rights Reserved.<br />
            Copying of images without permission prohibited.
          </p>
        </footer>
      `}

      ${selectedGallery && html`
        <${Carousel} 
          gallery=${selectedGallery} 
          onClose=${() => setSelectedGallery(null)} 
        />
      `}
    </div>
  `;
};

export default App;
