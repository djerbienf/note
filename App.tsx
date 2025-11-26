import React, { useState, useEffect, useMemo, useContext } from 'react';
import { HashRouter, Routes, Route, Link, useParams, useLocation } from 'react-router-dom';
import { ideas } from './data';
import { BusinessIdea, Category } from './types';
import { Search, ArrowRight, DollarSign, Briefcase, ArrowLeft, Monitor, Wrench, Calculator, Palette, FileText, CheckCircle, Sparkles, ChevronUp, Copy, Check, Filter, Scale, Heart, Moon, Sun } from 'lucide-react';
import Fuse from 'fuse.js';

// --- Gestion du Thème (Dark Mode) ---
const ThemeContext = React.createContext<{
  isDark: boolean;
  toggleTheme: () => void;
}>({ isDark: false, toggleTheme: () => {} });

const useTheme = () => useContext(ThemeContext);

// --- Gestion des Favoris (Context) ---
const FavoritesContext = React.createContext<{
  favorites: number[];
  toggleFavorite: (id: number) => void;
}>({ favorites: [], toggleFavorite: () => {} });

const useFavorites = () => useContext(FavoritesContext);

// --- Hooks Utilitaires ---
const useScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
};

// --- Composants UI ---

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center justify-center p-2 rounded-full transition-all duration-200 ${
        copied 
          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' 
          : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600 dark:hover:bg-slate-800 dark:text-slate-500 dark:hover:text-slate-300'
      }`}
      title="Copier le lien"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
};

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) setIsVisible(true);
      else setIsVisible(false);
    };
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all z-50 focus:outline-none animate-bounce-in transform hover:scale-110"
          aria-label="Retour en haut"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </>
  );
};

// Rendu du contenu Markdown - Espacement RÉDUIT
const ContentRenderer = ({ content }: { content?: string }) => {
  if (!content) return null;
  const lines = content.split('\n');
  
  return (
    <div className="space-y-2 text-gray-700 dark:text-slate-300 leading-normal text-lg font-normal tracking-normal">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <br key={index} className="leading-none" />;

        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={index} className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 mt-6 mb-3 flex items-center tracking-tight">
              {trimmed.replace('### ', '')}
            </h3>
          );
        }

        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
             return (
                 <h4 key={index} className="text-lg font-bold text-gray-900 dark:text-white mt-4 mb-1">
                     {trimmed.replace(/\*\*/g, '')}
                 </h4>
             )
        }

        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <div key={index} className="flex items-start ml-1 mb-1 text-base">
              <span className="text-indigo-500 dark:text-indigo-400 mr-2 mt-1.5 text-[10px] flex-shrink-0">●</span>
              <span dangerouslySetInnerHTML={{ __html: formatBold(trimmed.substring(2)) }} />
            </div>
          );
        }

        if (/^\d+\.\s/.test(trimmed)) {
           return (
            <div key={index} className="flex items-start ml-1 mb-1 text-base">
              <span className="text-indigo-600 dark:text-indigo-400 mr-2 font-bold flex-shrink-0">{trimmed.split(' ')[0]}</span>
              <span dangerouslySetInnerHTML={{ __html: formatBold(trimmed.substring(trimmed.indexOf(' ') + 1)) }} />
            </div>
          );
        }

        return (
          <p key={index} dangerouslySetInnerHTML={{ __html: formatBold(trimmed) }} />
        );
      })}
    </div>
  );
};

const formatBold = (text: string) => {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-900 dark:text-white font-bold">$1</strong>');
};

const CategoryIcon = ({ category, className }: { category: string, className?: string }) => {
  switch (category) {
    case Category.TECH: return <Monitor className={className} />;
    case Category.INDUSTRIAL: return <Wrench className={className} />;
    case Category.FINANCE: return <Calculator className={className} />;
    case Category.ADMIN: return <FileText className={className} />;
    case Category.CREATIVE: return <Palette className={className} />;
    default: return <Briefcase className={className} />;
  }
};

const CategoryBadge: React.FC<{ category: string, isActive?: boolean, onClick?: () => void }> = ({ category, isActive = false, onClick }) => {
  let colorClass = "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700";
  
  if (isActive) {
    switch (category) {
        case Category.TECH: 
            colorClass = "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/50"; 
            break;
        case Category.INDUSTRIAL: 
            colorClass = "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700/50"; 
            break;
        case Category.FINANCE: 
            colorClass = "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/50"; 
            break;
        case Category.CREATIVE: 
            colorClass = "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/40 dark:text-fuchsia-300 dark:border-fuchsia-700/50"; 
            break;
        case Category.ADMIN: 
            colorClass = "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600"; 
            break;
        default: 
            colorClass = "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700/50";
    }
  }

  const Component = onClick ? 'button' : 'span';

  return (
    <Component 
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all duration-200 whitespace-nowrap ${colorClass} ${isActive ? 'shadow-sm' : 'opacity-80 hover:opacity-100'}`}
    >
      <CategoryIcon category={category} className="w-3.5 h-3.5" />
      {category}
    </Component>
  );
};

// --- Page d'Accueil ---
const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("Toutes");
  const [visibleCount, setVisibleCount] = useState(12);
  const { favorites } = useFavorites();
  const { isDark } = useTheme();
  
  useEffect(() => {
    setVisibleCount(12);
  }, [searchTerm, filterCategory]);

  const fuse = useMemo(() => new Fuse(ideas, {
    keys: [
      { name: 'title', weight: 0.5 },
      { name: 'description', weight: 0.3 },
      { name: 'content', weight: 0.1 },
      { name: 'category', weight: 0.1 }
    ],
    threshold: 0.3,
    includeScore: true
  }), []);

  const filteredIdeas = useMemo(() => {
    let results = ideas;
    if (searchTerm.trim()) {
      const fuseResults = fuse.search(searchTerm);
      results = fuseResults.map(result => result.item);
    }
    
    if (filterCategory === "Favoris") {
      results = results.filter(idea => favorites.includes(idea.id));
    } else if (filterCategory !== "Toutes") {
      results = results.filter(idea => idea.category === filterCategory);
    }
    
    return results;
  }, [searchTerm, filterCategory, fuse, favorites]);

  const displayedIdeas = filteredIdeas.slice(0, visibleCount);
  const hasMore = visibleCount < filteredIdeas.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-sans text-gray-900 dark:text-gray-100 selection:bg-indigo-200 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300">
      <ScrollToTopButton />
      
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800 sticky top-0 z-30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
            <div>
                <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tight flex items-center gap-3">
                    <span className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20">161</span>
                    Idées de Business
                </h1>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="w-full md:w-auto relative group flex-grow max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400 dark:text-slate-500" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-10 py-2.5 bg-gray-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/40 focus:bg-white dark:focus:bg-slate-800 sm:text-sm transition-all duration-200 shadow-sm"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm("")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <span className="text-xs font-bold">✕</span>
                    </button>
                )}
                </div>
                
                <ThemeToggle />
            </div>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
             <button
                onClick={() => setFilterCategory("Toutes")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border ${
                    filterCategory === "Toutes" 
                    ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-black dark:border-white' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700'
                }`}
             >
                Tout voir
             </button>
             <button
                onClick={() => setFilterCategory("Favoris")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border flex items-center gap-2 ${
                    filterCategory === "Favoris" 
                    ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900' 
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-red-50 hover:text-red-500 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                }`}
             >
                <Heart className={`w-3.5 h-3.5 ${filterCategory === "Favoris" ? 'fill-current' : ''}`} />
                Favoris
                {favorites.length > 0 && (
                  <span className={`ml-1 opacity-75`}>({favorites.length})</span>
                )}
             </button>
             <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-2 flex-shrink-0"></div>
             {Object.values(Category).map(cat => (
                <CategoryBadge 
                    key={cat} 
                    category={cat} 
                    isActive={filterCategory === cat}
                    onClick={() => setFilterCategory(cat)}
                />
             ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {filteredIdeas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6 text-gray-300 dark:text-slate-600">
               {filterCategory === "Favoris" ? <Heart className="w-10 h-10" /> : <Search className="w-10 h-10" />}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {filterCategory === "Favoris" ? "Aucun favori" : "Aucun résultat"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8 text-sm">
              {filterCategory === "Favoris" 
                ? "Cliquez sur le cœur dans les fiches pour sauvegarder vos idées préférées." 
                : "Essayez d'autres mots-clés."}
            </p>
            <button 
              onClick={() => {setSearchTerm(""); setFilterCategory("Toutes");}}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors shadow-lg shadow-indigo-500/20"
            >
              Voir toutes les idées
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {displayedIdeas.map((idea) => {
                  const isFav = favorites.includes(idea.id);
                  return (
                    <Link to={`/activity/${idea.id}`} key={idea.id} className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-100 dark:hover:border-slate-700 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden h-full relative">
                        {isFav && (
                          <div className="absolute top-4 right-4 z-10">
                            <Heart className="w-5 h-5 text-red-500 fill-current drop-shadow-md animate-pulse-once" />
                          </div>
                        )}
                        
                        <div className="p-6 flex-grow flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black tracking-widest text-indigo-500/50 dark:text-indigo-400/50 uppercase">#{idea.id.toString().padStart(3, '0')}</span>
                                <CategoryIcon category={idea.category} className="w-5 h-5 text-gray-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                            </div>
                            
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                                {idea.title}
                            </h3>

                            <div className="mb-4">
                                <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-gray-50 text-gray-500 border border-gray-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 dark:group-hover:bg-indigo-900/30 dark:group-hover:text-indigo-300 dark:group-hover:border-indigo-800 transition-colors">
                                    {idea.category}
                                </span>
                            </div>
                            
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed flex-grow font-medium">
                                {idea.description}
                            </p>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900 flex items-center justify-between">
                             <div className="flex items-center text-xs font-bold text-gray-900 dark:text-gray-200">
                                <span className="text-gray-400 dark:text-slate-500 mr-1 font-normal">Budget:</span> {idea.budget}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-gray-100 dark:border-slate-700 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-colors">
                                <ArrowRight className="w-4 h-4 text-gray-300 dark:text-slate-500 group-hover:text-white transition-colors" />
                            </div>
                        </div>
                    </Link>
                  );
                })}
            </div>

            {hasMore && (
                <div className="mt-16 text-center">
                    <button 
                        onClick={handleLoadMore}
                        className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-black hover:border-transparent transition-all shadow-sm"
                    >
                        Charger plus d'idées
                    </button>
                </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

// --- Page de Détail ---
const ActivityDetail = () => {
  useScrollToTop();
  const { id } = useParams();
  const idea = ideas.find(i => i.id === Number(id));
  const { favorites, toggleFavorite } = useFavorites();
  const { isDark } = useTheme();

  if (!idea) return <div className="min-h-screen flex items-center justify-center text-xl text-gray-500 dark:text-slate-400 dark:bg-slate-950">Activité non trouvée.</div>;

  const isFavorite = favorites.includes(idea.id);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-gray-900 dark:text-gray-100 selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-300">
      <ScrollToTopButton />
      
      <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 sticky top-0 z-40 transition-all">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link to="/" className="group inline-flex items-center text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Retour
            </Link>
            
            <div className="flex items-center gap-1">
                 <button
                    onClick={() => toggleFavorite(idea.id)}
                    className={`p-2 rounded-full transition-all duration-200 ${
                        isFavorite 
                        ? 'bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40' 
                        : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600 dark:hover:bg-slate-800 dark:text-slate-500 dark:hover:text-slate-300'
                    }`}
                    title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                 >
                    <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                 </button>
                 <div className="h-4 w-px bg-gray-200 dark:bg-slate-800 mx-2"></div>
                 <CopyButton text={window.location.href} />
                 <div className="ml-2">
                    <ThemeToggle />
                 </div>
            </div>
          </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 pb-32">
        
        <header className="mb-10 text-center">
            <div className="flex justify-center mb-6 scale-110">
                <CategoryBadge category={idea.category} isActive={true} />
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-tighter mb-8 leading-[1.1] drop-shadow-sm">
                {idea.title}
            </h1>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 border-y border-gray-100 dark:border-slate-800 py-6 text-sm">
                 <div className="flex flex-col items-center sm:items-start">
                     <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1">Budget</span>
                     <span className="font-bold text-gray-900 dark:text-white text-lg">{idea.budget}</span>
                 </div>
                 <div className="hidden sm:block w-px h-10 bg-gray-100 dark:bg-slate-800"></div>
                 <div className="flex flex-col items-center sm:items-start">
                     <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1">Potentiel</span>
                     <span className="font-bold text-gray-900 dark:text-white text-lg">Scalable</span>
                 </div>
                 <div className="hidden sm:block w-px h-10 bg-gray-100 dark:bg-slate-800"></div>
                 <div className="flex flex-col items-center sm:items-start max-w-xs text-center sm:text-left">
                     <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-1">Le Secret</span>
                     <span className="font-medium text-gray-900 dark:text-white italic leading-tight">"{idea.whyItWorks}"</span>
                 </div>
            </div>
        </header>

        <div className="prose prose-lg prose-slate dark:prose-invert mx-auto prose-headings:font-bold prose-headings:tracking-tight prose-a:text-indigo-600 dark:prose-a:text-indigo-400 hover:prose-a:text-indigo-500 prose-img:rounded-2xl">
             <div className="font-serif text-xl leading-relaxed text-gray-600 dark:text-slate-300 mb-8 border-l-4 border-indigo-500 pl-6 italic bg-gray-50 dark:bg-slate-900/50 py-4 pr-4 rounded-r-lg">
                 {idea.description}
             </div>
             
             <hr className="border-gray-100 dark:border-slate-800 my-8 opacity-50" />

             {idea.content ? (
                 <ContentRenderer content={idea.content} />
             ) : (
                <div className="p-12 bg-gray-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800 text-center">
                     <p className="text-gray-500 dark:text-slate-500 font-medium">Contenu détaillé en cours de rédaction.</p>
                </div>
             )}
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center gap-4">
            {idea.id > 1 ? (
                <Link to={`/activity/${idea.id - 1}`} className="flex-1 group flex flex-col items-start p-5 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors text-left border border-transparent hover:border-gray-200 dark:hover:border-slate-800">
                  <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center tracking-widest">
                    <ArrowLeft className="w-3 h-3 mr-1" /> Précédent
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base line-clamp-1 group-hover:underline decoration-indigo-500/30 underline-offset-4">
                     {ideas.find(i => i.id === idea.id - 1)?.title}
                  </span>
                </Link>
            ) : <div className="flex-1"></div>}
            
            {idea.id < 161 ? (
                <Link to={`/activity/${idea.id + 1}`} className="flex-1 group flex flex-col items-end p-5 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors text-right border border-transparent hover:border-gray-200 dark:hover:border-slate-800">
                  <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center tracking-widest">
                    Suivant <ArrowRight className="w-3 h-3 ml-1" />
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base line-clamp-1 group-hover:underline decoration-indigo-500/30 underline-offset-4">
                     {ideas.find(i => i.id === idea.id + 1)?.title}
                  </span>
                </Link>
            ) : <div className="flex-1"></div>}
        </div>

      </article>
    </div>
  );
};

const ThemeToggle = () => {
    const { isDark, toggleTheme } = useTheme();
    return (
        <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl text-gray-500 bg-gray-100/50 hover:bg-gray-200/50 dark:text-slate-400 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 transition-all active:scale-95"
            title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
        >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
    );
};

const App = () => {
  const [isDark, setIsDark] = useState<boolean>(() => {
     if (typeof window !== 'undefined') {
         const saved = localStorage.getItem('theme');
         if (saved) return saved === 'dark';
         return window.matchMedia('(prefers-color-scheme: dark)').matches;
     }
     return false;
  });

  useEffect(() => {
     const root = window.document.documentElement;
     if (isDark) {
         root.classList.add('dark');
         localStorage.setItem('theme', 'dark');
     } else {
         root.classList.remove('dark');
         localStorage.setItem('theme', 'light');
     }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('businessIdeasFavorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('businessIdeasFavorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <FavoritesContext.Provider value={{ favorites, toggleFavorite }}>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/activity/:id" element={<ActivityDetail />} />
          </Routes>
        </HashRouter>
      </FavoritesContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;