import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Check, X, Disc, User, MessageSquare, Play, Edit2, Plus, RefreshCw, Star } from 'lucide-react';



export default function TinderApp() {
  const [songs, setSongs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState({ user: '', pass: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showLyricsModal, setShowLyricsModal] = useState(false); // <--- AÑADIR ESTO
  const [songLyrics, setSongLyrics] = useState(null);
  const [isFetchingLyrics, setIsFetchingLyrics] = useState(false);
  
  // Nuevos estados para el sistema de dos fases
  const [activeTab, setActiveTab] = useState('filtratu'); 
  const [untaggedCount, setUntaggedCount] = useState(0);

  // Efecto para recargar datos al cambiar de pestaña
  useEffect(() => {
    if (isAuthenticated) {
      fetchData(credentials.user, credentials.pass, activeTab);
    }
  }, [activeTab]);    
  const [spotifyThumbnail, setSpotifyThumbnail] = useState('');
  const [spotifyPreviewUrl, setSpotifyPreviewUrl] = useState('');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedArtist, setEditedArtist] = useState('');
  const [editedGenres, setEditedGenres] = useState([]);
  const [allSystemGenres, setAllSystemGenres] = useState([]);
  const [resolving, setResolving] = useState(false);

  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return hash;
  };

  const getGenrePath = (genre, hierarchy) => {
    if (!genre) return [];
    const pathList = [genre.trim()];
    let current = genre.trim();
    let depth = 0;
    while (hierarchy[current.toLowerCase()] && depth < 10) {
      current = hierarchy[current.toLowerCase()].trim();
      pathList.push(current);
      depth++;
    }
    return pathList.reverse();
  };

  const getGenreColorRaw = (genreName, hierarchy = {}) => {
    if (!genreName) return '340, 80%, 50%';
    const lowerName = genreName.toLowerCase().trim();
    if (lowerName === 'bestelakoak') return '0, 0%, 55%';
    
    const path = getGenrePath(genreName, hierarchy);
    const root = path.length > 0 ? path[0] : genreName;
    
    const rootHash = hashString(root.toLowerCase().trim());
    let hue = Math.abs(rootHash % 360);
    
    const fullHash = hashString(lowerName);
    if (root.toLowerCase().trim() !== lowerName) {
      const shift = (fullHash % 50) - 25;
      hue = (hue + shift + 360) % 360;
    }
    
    const saturation = 80 - (Math.abs(fullHash) % 15);
    const lightness = 48 + (Math.abs(fullHash) % 10);
    
    return `${hue}, ${saturation}%, ${lightness}%`;
  };

  const fetchSystemGenres = async () => {
    const authHeader = 'Basic ' + btoa(`${credentials.user}:${credentials.pass}`);
    try {
      const res = await fetch('/api/admin/genres/all', { headers: { 'Authorization': authHeader } });
      if (res.ok) {
        const data = await res.json();
        setAllSystemGenres(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewGenreChange = (e) => {
    const val = e.target.value;
    setNewGenreInput(val);
    if (val.trim().length > 0) {
      const filtered = allSystemGenres.filter(g => 
        g.toLowerCase().includes(val.toLowerCase()) && !editedGenres.includes(g)
      );
      setAutocompleteSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setAutocompleteSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectGenre = (genreName) => {
    const cleanGenre = genreName.trim();
    if (cleanGenre && !editedGenres.includes(cleanGenre)) {
      setEditedGenres(prev => [...prev, cleanGenre]);
    }
    setIsDropdownOpen(false); // Cierra el menú al seleccionar
  };

  const handleRemoveGenre = (genreToRemove) => {
    setEditedGenres(prev => prev.filter(g => g !== genreToRemove));
  };

  const handleAutoResolve = async () => {
    setResolving(true);
    const authHeader = 'Basic ' + btoa(`${credentials.user}:${credentials.pass}`);
    try {
      const res = await fetch(`/api/admin/songs/${songs[0].id}/resolve-genres`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editedTitle,
          artist: editedArtist
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.genres) {
          setEditedGenres(data.genres);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResolving(false);
    }
  };

  const handleSaveMetadata = async () => {
    const authHeader = 'Basic ' + btoa(`${credentials.user}:${credentials.pass}`);
    try {
      const res = await fetch(`/api/admin/songs/${songs[0].id}/metadata`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editedTitle,
          artist: editedArtist,
          genres: editedGenres
        })
      });
      if (res.ok) {
        setSongs(prev => {
          const next = [...prev];
          next[0] = {
            ...next[0],
            real_title: editedTitle,
            real_artist: editedArtist,
            genres: editedGenres
          };
          return next;
        });
        setIsEditing(false);
      } else {
        alert("Errorea gordetzean.");
      }
    } catch (e) {
      console.error(e);
      alert("Errorea gordetzean.");
    }
  };

  const handleTagSave = async () => {
    if (editedGenres.length === 0) {
      alert("Sartu gutxienez genero bat!");
      return;
    }
    const authHeader = 'Basic ' + btoa(`${credentials.user}:${credentials.pass}`);
    try {
      // Guardamos la metadata completa por si el moderador ha arreglado también el título/artista
      const metaRes = await fetch(`/api/admin/songs/${songs[0].id}/metadata`, {
        method: 'PUT',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: editedTitle, 
          artist: editedArtist, 
          genres: editedGenres,
          submitters: songs[0].submitters || [],
          comments: songs[0].comments || []
        })
      });

      const metaData = metaRes.ok ? await metaRes.json() : {};
      const affectedFromMeta = metaData.affectedCount || 0;
      
      // 2. Hacemos la llamada al nuevo endpoint de validación de tag
      const res = await fetch(`/api/admin/songs/${songs[0].id}/tag`, {
        method: 'PUT',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ genres: editedGenres, artist: editedArtist })
      });

      const tagData = res.ok ? await res.json() : {};
      const affectedFromTag = tagData.affectedCount || 0;

      if (res.ok) {
        // Obtenemos el total real de canciones que el backend ha afectado en la cascada
        const totalAffectedRows = Math.max(affectedFromMeta, affectedFromTag);

        // Helper idéntico al del backend para trocear artistas en la UI
        const splitArtistsFE = (str) => {
          if (!str || str === 'Ezezaguna') return [];
          return str.split(/\s*(?:,|&|\+|\by\b|\bft\.?\b|\bfeat\.?\b)\s*/i)
                    .map(a => a.trim().toLowerCase())
                    .filter(a => a.length > 0);
        };

        // Obtenemos la lista de artistas del tema editado y seleccionamos al primero (Caso 1)
        const currentArtists = splitArtistsFE(editedArtist);
        const firstArtist = currentArtists[0] || '';

        // FILTRO EN TIEMPO REAL MULTI-ARTISTA: Limpiamos las cartas de la UI
        setSongs(prev => {
          // Quitamos la primera tarjeta (la actual) y filtramos la cola restante
          return prev.slice(1).filter(s => {
            if (!firstArtist) return true;
            
            // Troceamos los artistas de la canción de la cola que estamos evaluando
            const songArtistsList = splitArtistsFE(s.real_artist);
            
            // Si la canción de la cola contiene al artista principal que acabamos de registrar,
            // significa que el backend ya la ha clasificado en cascada, así que la eliminamos (devuelve false)
            const containsMainArtist = songArtistsList.includes(firstArtist);
            return !containsMainArtist;
          });
        });
        setUntaggedCount(prev => Math.max(0, prev - 1 - totalAffectedRows));
        setIsDropdownOpen(false);
      } else {
        alert("Errorea etiketatzean.");
      }
    } catch (e) {
      console.error(e);
      alert("Errorea etiketatzean.");
    }
  };

  const fetchLyrics = async () => {
    // Si ya tenemos la letra cargada (de la caché), abrimos el modal directamente
    if (songLyrics) {
      setShowLyricsModal(true);
      return;
    }

    setIsFetchingLyrics(true);
    const authHeader = 'Basic ' + btoa(`${credentials.user}:${credentials.pass}`);
    try {
      const res = await fetch(`/api/admin/songs/${songs[0].id}/lyrics`, {
        headers: { 'Authorization': authHeader }
      });
      const data = await res.json();
      
      if (data.lyrics) {
        setSongLyrics(data.lyrics);
        setShowLyricsModal(true); // <--- AÑADIDO: Abrir modal al cargar
      } else {
        setSongLyrics("Ez da letrik aurkitu 😔");
        setShowLyricsModal(true); // <--- AÑADIDO: Abrir modal incluso con error
      }
    } catch (e) {
      setSongLyrics("Errorea letrak kargatzean.");
      setShowLyricsModal(true); // <--- AÑADIDO: Abrir modal con error de red
    }
    setIsFetchingLyrics(false);
  };

  // Auto-play next song when the active song changes, reset drag, load Spotify cover
  useEffect(() => {
    setIsPlaying(true);
    setSpotifyThumbnail('');
    setSpotifyPreviewUrl('');
    setSongLyrics(null);
    
    // Forzamos la edición si estamos en la fase de etiquetado
    if (activeTab === 'etiketatu') {
      setIsEditing(true);
      fetchSystemGenres();
    } else {
      setIsEditing(false);
    }

    if (songs[0]) {
      setEditedTitle(songs[0].real_title || '');
      setEditedArtist(songs[0].real_artist || '');
      setEditedGenres(songs[0].genres || []);
    } else {
      setEditedTitle('');
      setEditedArtist('');
      setEditedGenres([]);
    }
    
    if (!songs[0]) return;
    
    const url = songs[0].url;
    const isSpotify = url.includes('spotify.com');
    if (isSpotify) {
      // Fetch Spotify metadata (cover, title, artist)
      fetch(`/api/spotify-metadata?url=${encodeURIComponent(url)}`)
        .then(res => res.json())
        .then(data => {
          if (data.thumbnail_url) {
            setSpotifyThumbnail(data.thumbnail_url);
          }
          if (data.preview_url) {
            setSpotifyPreviewUrl(data.preview_url);
          }
          
          const realTitle = data.title || songs[0].real_title;
          const realArtist = data.artist || songs[0].real_artist || 'Ezezaguna';
          
          // Auto-correct local edit inputs with real Spotify metadata
          setEditedTitle(realTitle);
          setEditedArtist(realArtist);
        })
        .catch(err => console.error("Error fetching Spotify cover:", err));
    }
  }, [songs[0]?.id]);

  // Login form

  const handleLogin = (e) => {
    e.preventDefault();
    if (credentials.user && credentials.pass) {
      setIsAuthenticated(true);
      fetchData(credentials.user, credentials.pass);
    }
  };

  const fetchData = async (user, pass, tab = activeTab) => {
    setLoading(true);
    setError('');
    const authHeader = 'Basic ' + btoa(`${user}:${pass}`);
    try {
      const endpoint = tab === 'filtratu' ? '/api/admin/songs/pending' : '/api/admin/songs/untagged';
      
      const [songsRes, statsRes, untaggedRes] = await Promise.all([
        fetch(endpoint, { headers: { 'Authorization': authHeader } }),
        fetch('/api/admin/songs/stats', { headers: { 'Authorization': authHeader } }),
        fetch('/api/admin/songs/untagged', { headers: { 'Authorization': authHeader } }) // Siempre obtenemos el conteo
      ]);
      
      if (!songsRes.ok || !statsRes.ok || !untaggedRes.ok) {
        throw new Error(songsRes.status === 401 ? 'Kredentzial okerrak' : 'Errorea datuak lortzean');
      }
      
      const [fetchedSongs, statsData, untaggedData] = await Promise.all([
        songsRes.json(),
        statsRes.json(),
        untaggedRes.json()
      ]);
      
      setUntaggedCount(untaggedData.length);
      
      if (tab === 'filtratu') {
        // The server already pre-sorted the queue using the priority algorithm!
        // We preserve the server-computed song._priorityScore for rendering stars.
        fetchedSongs.forEach(song => {
          if (song._priorityScore === undefined) {
            song._priorityScore = 0;
          }
        });
      }
      
      setSongs(fetchedSongs);
      setStats(statsData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const handleAction = async (status) => {
    if (songs.length === 0) return;
    
    const currentSong = songs[0];
    const authHeader = 'Basic ' + btoa(`${credentials.user}:${credentials.pass}`);
    
    try {
      // If accepting, save any local metadata changes first
      if (status === 'accepted' && (editedTitle !== currentSong.real_title || editedArtist !== currentSong.real_artist || JSON.stringify(editedGenres) !== JSON.stringify(currentSong.genres))) {
        await fetch(`/api/admin/songs/${currentSong.id}/metadata`, {
          method: 'PUT',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: editedTitle,
            artist: editedArtist,
            genres: editedGenres
          })
        });
      }

      await fetch(`/api/admin/songs/${currentSong.id}/tinder-action`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status, 
          genres: status === 'accepted' ? editedGenres : currentSong.genres 
        })
      });
      
      setSongs(prev => prev.slice(1));
    } catch (err) {
      console.error(err);
      alert("Errorea ekintza burutzean");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-purple-500/30">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Tinder Musikal</h1>
            <p className="text-slate-400 mt-2">Sarbide pribatua</p>
          </div>
          {error && <div className="bg-red-500/20 text-red-300 p-3 rounded mb-4 text-sm">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Erabiltzailea</label>
              <input 
                type="text" 
                value={credentials.user}
                onChange={e => setCredentials({...credentials, user: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Pasahitza</label>
              <input 
                type="password" 
                value={credentials.pass}
                onChange={e => setCredentials({...credentials, pass: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95">
              Sartu
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 text-white flex flex-col min-h-[600px]">
      <header className="border-b border-slate-800/80 pb-4 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">Tinder Musikal</h1>
            <p className="text-sm text-slate-400 font-medium">Musika Sailkapen Sistema</p>
          </div>
          <div className="text-right flex flex-col gap-1 items-end">
            <span className="bg-purple-500/20 text-purple-300 text-sm px-3 py-1 rounded-full font-bold">
              {songs.length} ilaran
            </span>
          </div>
        </div>
        
        {/* Navegación de Fases */}
        <div className="flex gap-3 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 w-fit">
          <button 
            onClick={() => setActiveTab('filtratu')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'filtratu' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            Filtratu 🔥
          </button>
          <button 
            onClick={() => setActiveTab('etiketatu')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${activeTab === 'etiketatu' ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            Etiketatu 🏷️
            {untaggedCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full shadow">{untaggedCount}</span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        {loading ? (
          <div className="text-purple-400 animate-pulse font-bold text-xl">Kargatzen...</div>
        ) : songs.length === 0 ? (
          <div className="text-center py-12">
            <Disc className="w-16 h-16 text-slate-700 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-slate-400">Ez dago abesti gehiago!</h2>
            <p className="text-slate-500">Lan bikaina egin duzu gaur.</p>
          </div>
        ) : (
          <div className="relative w-full max-w-sm h-[560px] perspective-1000">
            <AnimatePresence>
              <motion.div
                key={songs[0].id}
                initial={{ scale: 0.95, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.8,
                  transition: { duration: 0.2 } 
                }}
                className="absolute inset-0 bg-slate-950 rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/10 border border-slate-700/50 flex flex-col justify-end"
              >                {(() => {
                  const url = songs[0].url;
                  const isSpotify = url.includes('spotify.com');
                  
                  // Extract YouTube ID for direct YouTube links
                  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
                  const ytVideoId = ytMatch ? ytMatch[1] : null;

                  // Get Spotify Embed URL
                  let spotifyEmbedUrl = null;
                  if (isSpotify) {
                    try {
                      const parsed = new URL(url);
                      const separator = parsed.search ? '&' : '?';
                      spotifyEmbedUrl = `https://open.spotify.com/embed${parsed.pathname}${parsed.search}${separator}autoplay=1`;
                    } catch (e) {}
                  }

                  if (!ytVideoId && !isSpotify) {
                    return (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 p-4 text-center">
                        <p>Ezin da bideoa edo abestia kargatu.<br/><a href={songs[0].url} target="_blank" rel="noreferrer" className="text-purple-400 underline mt-2 block">Ikusi jatorrizkoa</a></p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {/* Background fallback gradient to keep view elegant */}
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 z-[-1]" />

                      {/* 1. Static/Cover Image */}
                      {isSpotify ? (
                        spotifyThumbnail && (
                          <img 
                            src={spotifyThumbnail}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                            alt="Spotify Cover"
                          />
                        )
                      ) : (
                        ytVideoId && (
                          <img 
                            src={`https://img.youtube.com/vi/${ytVideoId}/maxresdefault.jpg`}
                            onError={(e) => { e.target.src = `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg`; }}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                            alt="Video Cover"
                          />
                        )
                      )}

                      {/* 2. YouTube Background player iframe (hidden for direct YouTube links) */}
                      {!isSpotify && ytVideoId && isPlaying && (
                        <div className="absolute w-0 h-0 overflow-hidden pointer-events-none opacity-0">
                          <iframe
                            src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1&mute=0&controls=0&loop=1&playlist=${ytVideoId}&modestbranding=1&rel=0&iv_load_policy=3`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="autoplay; encrypted-media"
                          />
                        </div>
                      )}

                      {/* 3. Spotify Embed Player (interactive overlay, so the user can manually play exact track if NO preview_url is available) */}
                      {isSpotify && spotifyEmbedUrl && !spotifyPreviewUrl && (
                        <div className="absolute inset-x-4 top-[15%] z-20 flex justify-center items-center pointer-events-auto">
                          <iframe 
                            src={spotifyEmbedUrl} 
                            width="100%" 
                            height="352" 
                            frameBorder="0" 
                            allowFullScreen="" 
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                            loading="lazy"
                            className="rounded-2xl shadow-2xl border border-slate-700/50"
                          />
                        </div>
                      )}

                      {/* 3.1. Hidden HTML5 Audio player for Spotify Preview URL (autoplays, cleaner UX) */}
                      {isSpotify && spotifyPreviewUrl && isPlaying && (
                        <audio
                          src={spotifyPreviewUrl}
                          autoPlay
                          loop
                        />
                      )}

                      {/* 4. Loading overlay for Spotify cover */}
                      {isSpotify && !spotifyThumbnail && (
                        <div className="absolute inset-0 w-full h-full bg-slate-950 flex flex-col items-center justify-center text-purple-500/40 z-5">
                          <Disc className="w-12 h-12 animate-spin" />
                          <span className="text-xs mt-2 font-medium">Carátula precargando...</span>
                        </div>
                      )}



                      {/* Dark gradient overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent z-10 pointer-events-none" />
                      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none" />

                      {/* Top priority badges */}
                      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
                        {songs[0]._priorityScore >= 99999 ? (
                          <span className="bg-red-500/95 text-white text-[10px] uppercase font-black px-2.5 py-1 rounded-full shadow-lg tracking-wider">
                            Generorik gabe
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="bg-slate-900/90 text-purple-300 text-[9px] uppercase font-black px-2.5 py-1 rounded-full shadow-lg tracking-wider border border-purple-500/20 backdrop-blur-sm self-start">
                              Lehentasuna (Prioridad)
                            </span>
                            <div className="flex gap-0.5 bg-slate-950/80 p-1.5 rounded-full shadow-lg border border-purple-500/10 backdrop-blur-sm self-start">
                              {[1, 2, 3, 4, 5].map((sIndex) => {
                                const score = songs[0]._priorityScore;
                                let starCount = 1;
                                if (score >= 1000) starCount = 5;
                                else if (score >= 100) starCount = 4;
                                else if (score >= 10) starCount = 3;
                                else if (score >= 2) starCount = 2;
                                else starCount = 1;
                                
                                return (
                                  <Star
                                    key={sIndex}
                                    className={`w-3.5 h-3.5 ${
                                      sIndex <= starCount
                                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]'
                                        : 'text-slate-600 fill-transparent'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Details Overlay */}
                      <div 
                        className="absolute inset-x-0 bottom-0 px-6 pt-6 z-20 flex flex-col justify-end pointer-events-none"
                        style={{ paddingBottom: '120px' }}
                      >
                        <div className={`pr-2 pointer-events-auto scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent ${activeTab === 'filtratu' ? 'overflow-y-auto max-h-[250px]' : ''}`}>
                          {activeTab === 'etiketatu' ? (
                            /* MODO ETIKETATU (Obligatorio, sin texto libre) */
                            <div className="flex flex-col gap-3 bg-slate-950/95 backdrop-blur-md p-4 rounded-2xl border border-pink-500/30 text-xs shadow-2xl pointer-events-auto">
                              
                              {/* Info de solo lectura de la canción (si se quisiera editar el título, sería aquí, pero lo mantenemos bloqueado o semi-bloqueado) */}
                              <div>
                                <h2 className="text-xl font-black text-white leading-tight mb-1">{songs[0].real_title}</h2>
                                <p className="text-pink-400 font-extrabold text-sm mb-3">{songs[0].real_artist}</p>
                              </div>
                              
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <label className="block text-[10px] font-bold text-pink-400 uppercase tracking-wider">Generoak Aukeratu</label>
                                  <button
                                    type="button"
                                    onClick={handleAutoResolve}
                                    disabled={resolving}
                                    className="text-[10px] bg-pink-600 hover:bg-pink-500 disabled:bg-pink-800 disabled:opacity-60 text-white font-bold px-2 py-1 rounded flex items-center gap-1 transition-all"
                                  >
                                    <RefreshCw className={`w-3 h-3 ${resolving ? 'animate-spin' : ''}`} />
                                    {resolving ? 'Ebazten...' : 'Last.fm Auto'}
                                  </button>
                                </div>
                                
                                {/* Chips de géneros seleccionados */}
                                <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-slate-900/50 rounded-lg border border-slate-800 min-h-[40px]">
                                  {editedGenres.length > 0 ? (
                                    editedGenres.map(g => (
                                      <span 
                                        key={g} 
                                        className="px-2.5 py-1 rounded-full border text-[10px] font-extrabold flex items-center gap-1.5 shadow-lg"
                                        style={{
                                          backgroundColor: `hsla(${getGenreColorRaw(g, stats?.hierarchy)}, 0.15)`,
                                          borderColor: `hsla(${getGenreColorRaw(g, stats?.hierarchy)}, 0.4)`,
                                          color: `hsl(${getGenreColorRaw(g, stats?.hierarchy)})`
                                        }}
                                      >
                                        {g}
                                        <button type="button" onClick={() => handleRemoveGenre(g)} className="hover:text-white font-black focus:outline-none transition-colors">
                                          <X className="w-3 h-3" strokeWidth={3} />
                                        </button>
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[11px] text-slate-500 italic flex items-center h-full">Ez dago generorik. Aukeratu bat azpian 👇</span>
                                  )}
                                </div>
                                
                                {/* EL CUSTOM COMBO BOX */}
                                <div className="relative w-full">
                                  <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full flex justify-between items-center bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold hover:border-pink-500 transition-all focus:outline-none"
                                  >
                                    <span>Aukeratu generoa sisteman...</span>
                                    <span className={`transform transition-transform duration-300 text-pink-500 ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                                  </button>
                                  {isDropdownOpen && (
                                    <div className="absolute left-0 right-0 bottom-full mb-2 bg-[rgba(15,4,15,0.95)] backdrop-blur-xl border border-pink-500/30 rounded-xl shadow-[0_0_30px_rgba(255,51,102,0.15)] max-h-[220px] overflow-y-auto z-50 scrollbar-thin scrollbar-thumb-pink-500/50 scrollbar-track-transparent">
                                      {(() => {
                                        const hierarchy = stats?.hierarchy || {};
                                        
                                        // 1. Identificamos los géneros Raíz reales (Los que no tienen ningún padre arriba)
                                        const roots = allSystemGenres.filter(g => !hierarchy[g.toLowerCase()]);
                                        roots.sort((a, b) => a.localeCompare(b));

                                        // 2. Construimos un mapa de hijos multidimensional para cualquier nodo
                                        const childrenMap = {};
                                        allSystemGenres.forEach(g => {
                                          const parent = hierarchy[g.toLowerCase()];
                                          if (parent) {
                                            // Buscamos el nombre canónico del padre para evitar problemas de mayúsculas
                                            const canonicalParent = allSystemGenres.find(pg => pg.toLowerCase() === parent.toLowerCase()) || parent;
                                            if (!childrenMap[canonicalParent]) childrenMap[canonicalParent] = [];
                                            childrenMap[canonicalParent].push(g);
                                          }
                                        });

                                        // Ordenamos las ramas de hijos alfabéticamente
                                        Object.keys(childrenMap).forEach(p => childrenMap[p].sort((a, b) => a.localeCompare(b)));

                                        if (roots.length === 0) return <div className="p-3 text-slate-400 text-center text-xs">Ez dago genero gehiagorik.</div>;

                                        // 3. FUNCIÓN RECURSIVA: Pinta el género y desciende por sus ramas aplicando sangrías CSS nativas
                                        const renderGenreNode = (genre, depth = 0) => {
                                          if (editedGenres.includes(genre)) return null;

                                          const genreColor = getGenreColorRaw(genre, hierarchy);
                                          const children = childrenMap[genre] || [];

                                          // Calculamos sangrías fluidas basadas en el nivel de profundidad en el árbol
                                          const basePadding = depth === 0 ? 16 : depth === 1 ? 26 : 38;
                                          const hoverPadding = basePadding + 6;
                                          const prefix = depth === 0 ? '• ' : depth === 1 ? '— ' : '└─ ';

                                          return (
                                            <div key={genre} className="w-full">
                                              {/* Si es una raíz, le ponemos la cabecera de grupo pegajosa (Sticky) */}
                                              {depth === 0 && (
                                                <div 
                                                  className="px-3 py-1.5 text-[10px] font-black tracking-widest uppercase sticky top-0 bg-[rgba(15,4,15,0.95)] backdrop-blur-sm z-10 mt-1"
                                                  style={{ color: `hsl(${genreColor})`, borderBottom: `1px solid hsla(${genreColor}, 0.2)` }}
                                                >
                                                  {genre}
                                                </div>
                                              )}

                                              {/* Botón de acción interactivo */}
                                              <button
                                                type="button"
                                                onClick={() => handleSelectGenre(genre)}
                                                className={`w-full text-left py-2 text-xs font-bold transition-all hover:text-white flex items-center ${depth > 0 ? 'text-slate-400' : 'text-slate-200'}`}
                                                style={{ 
                                                  '--item-color': genreColor,
                                                  paddingLeft: `${basePadding}px`
                                                }}
                                                onMouseEnter={(e) => {
                                                  e.currentTarget.style.backgroundColor = `hsla(${genreColor}, 0.12)`;
                                                  e.currentTarget.style.borderLeft = `3px solid hsl(${genreColor})`;
                                                  e.currentTarget.style.paddingLeft = `${hoverPadding}px`;
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.style.backgroundColor = 'transparent';
                                                  e.currentTarget.style.borderLeft = 'none';
                                                  e.currentTarget.style.paddingLeft = `${basePadding}px`;
                                                }}
                                              >
                                                {depth === 0 ? `Guztiak / Todo ${genre}` : `${prefix}${genre}`}
                                              </button>

                                              {/* RAMIFICACIÓN RECURSIVA: Si este género tiene subgéneros, nos auto-llamamos sumando profundidad */}
                                              {children.length > 0 && (
                                                <div className="w-full border-l border-slate-800/20">
                                                  {children.map(child => renderGenreNode(child, depth + 1))}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        };

                                        // Inicializamos el árbol desde las raíces
                                        return roots.map(root => renderGenreNode(root, 0));
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex justify-end mt-2">
                                <button
                                  type="button"
                                  onClick={handleTagSave}
                                  className="w-full px-3 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-red-500 hover:from-pink-500 hover:to-red-400 text-white font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-pink-500/50"
                                >
                                  Gorde eta Hurrengoa ⏭️
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* MODO FILTRATU (100% Solo lectura, sin botón Edit2) */
                            <>
                              <div className="flex items-start justify-between gap-2 pointer-events-auto">
                                <div className="flex-1">
                                  <h2 className="text-2xl font-black text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                                    {songs[0].real_title}
                                  </h2>
                                  <p className="text-purple-400 font-extrabold text-lg mt-0.5 mb-3 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.9)]">
                                    {songs[0].real_artist}
                                  </p>
                                </div>
                                {/* Botón Edit2 Eliminado */}
                              </div>
                              
                              <div className="flex flex-wrap gap-1.5 mb-4 pointer-events-auto">
                                {songs[0].genres && songs[0].genres.map(g => (
                                  <span 
                                    key={g} 
                                    className="px-2.5 py-1 rounded-full backdrop-blur-md border text-[10px] font-extrabold"
                                    style={{
                                      backgroundColor: `hsla(${getGenreColorRaw(g, stats?.hierarchy)}, 0.15)`,
                                      borderColor: `hsla(${getGenreColorRaw(g, stats?.hierarchy)}, 0.3)`,
                                      color: `hsl(${getGenreColorRaw(g, stats?.hierarchy)})`
                                    }}
                                  >
                                    {g}
                                  </span>
                                ))}
                              </div>

                              <div className="bg-slate-950/80 backdrop-blur-md rounded-2xl p-3 border border-slate-800 shadow-xl pointer-events-auto transition-all duration-300 hover:border-purple-500/40">
                                {songs[0].comments && songs[0].comments.length > 0 ? (
                                  <div className="space-y-2">
                                    {songs[0].comments.map((c, i) => (
                                      <div key={i} className="flex items-start gap-1.5 text-slate-200 text-xs italic">
                                        <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-purple-400/80" />
                                        <p className="leading-relaxed">"{c}"</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-slate-600 text-xs italic ml-5">Iruzkinik ez</p>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-5 z-30 px-4">
                        {activeTab === 'filtratu' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setIsPlaying(false); handleAction('rejected'); }}
                            className="w-12 h-12 rounded-full bg-slate-950/90 backdrop-blur-md border-2 border-red-500 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] transform active:scale-90"
                          >
                            <X className="w-6 h-6" strokeWidth={3} />
                          </button>
                        )}

                        <button 
                          onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
                          className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-all shadow-[0_0_20px_rgba(147,51,234,0.4)] hover:shadow-[0_0_30px_rgba(147,51,234,0.6)] transform active:scale-90"
                        >
                          {isPlaying ? (
                            <div className="w-4 h-4 bg-white rounded-xs animate-pulse" />
                          ) : (
                            <Play className="w-6 h-6 fill-current ml-1" />
                          )}
                        </button>

                        {activeTab === 'filtratu' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setIsPlaying(false); handleAction('accepted'); }}
                            className="w-12 h-12 rounded-full bg-slate-950/90 backdrop-blur-md border-2 border-green-500 flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transform active:scale-90"
                          >
                            <Check className="w-6 h-6" strokeWidth={3} />
                          </button>
                        )}
                        {/* BOTÓN PARA ABRIR LETRAS (SUPERIOR IZQUIERDA DE LA ZONA DE TEXTO) */}
                        <div className="absolute top-2 left-2 z-10">
                          <button 
                            onClick={fetchLyrics}
                            disabled={isFetchingLyrics}
                            title="Ikusi abestiaren letra"
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm text-slate-300 text-[11px] font-bold rounded-lg hover:bg-purple-600/40 transition-colors uppercase tracking-wider border border-slate-700/50"
                          >
                            <span className="text-sm">🎤</span>
                            {isFetchingLyrics ? 'Kargatzen...' : 'Letra'}
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* 🟢 PEGA EL NUEVO BLOQUE AQUÍ, JUSTO EN ESTE HUECO: */}
      <AnimatePresence>
        {showLyricsModal && songLyrics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-lg z-[100] flex items-center justify-center p-4 md:p-10 pointer-events-auto"
            onClick={() => setShowLyricsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 w-full max-w-2xl max-h-[85vh] shadow-2xl shadow-purple-500/10 flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabecera del Modal */}
              <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-white leading-tight">
                    {songs[0]?.proposed_titles?.[0] || songs[0]?.real_title}
                  </h2>
                  <p className="text-sm font-bold text-purple-400 uppercase tracking-wider">
                    {songs[0]?.proposed_artists?.[0] || songs[0]?.real_artist}
                  </p>
                </div>
                <button 
                  onClick={() => setShowLyricsModal(false)}
                  className="ml-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Cuerpo del Modal */}
              <div className="overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-transparent">
                <p className="text-slate-200 text-base md:text-lg whitespace-pre-wrap font-medium italic leading-relaxed">
                  {songLyrics}
                </p>
              </div>
              
              {/* Pie del Modal */}
              <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                  Letra lortuta Genius bidez
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Stats Mini Footer */}
      {stats && (
        <footer className="mt-8 border-t border-slate-800/80 pt-4 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Sisteman {stats.total} genero etiketa erregistratuta daude. Onartzen dituzun abestiek banaketa zuzenduko dute.
          </p>
        </footer>
      )}
    </div>
  );
}
