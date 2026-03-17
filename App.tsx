import React, { useState, useCallback, useRef } from 'react';
import { generatePinterestData, generatePinterestImage } from './services/gemini';
import { PinterestContent } from './types';
import { OutputSection } from './components/OutputSection';
import { 
  Search, 
  Sparkles, 
  Layout, 
  Image as ImageIcon, 
  Loader2,
  Download,
  FileText,
  Terminal,
  ShieldCheck,
  Upload,
  X,
  ImagePlus
} from 'lucide-react';

const CATEGORIES = [
  "Home Decor", "DIY & Crafts", "Food & Drink", "Women's Fashion", 
  "Beauty", "Travel", "Health & Fitness", "Education", 
  "Technology", "Art & Design", "Gardening", "Weddings", 
  "Parenting", "Finance", "Motivational Quotes", "Inspirational Quotes"
];

const STYLES = [
  "Modern & Clean", "Minimalist", "Boho Chic", "Rustic / Farmhouse", 
  "Colorful & Bold", "Elegant & Luxury", "Infographic / Educational", 
  "Typography Focused", "Vintage / Retro", "Dark Mode / High Contrast"
];

// Mock Data for Simulation
const MOCK_USER = {
  name: "Creative User",
  email: "user@example.com",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
};

const App: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [style, setStyle] = useState(STYLES[0]);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [data, setData] = useState<PinterestContent | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  const [loadingText, setLoadingText] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedState, setCopiedState] = useState<Record<string, boolean>>({});

  // Auth States
  const [user, setUser] = useState<typeof MOCK_USER | null>(null);

  const MANDATORY_HASHTAGS = ["#ads", "#affiliate", "#sponsored", "#aigenerated"];

  // Auth Handlers
  const handleGoogleLogin = () => {
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      'about:blank', 
      'Google Login', 
      `width=${width},height=${height},top=${top},left=${left}`
    );
    
    if (popup) {
      popup.document.write(`
        <div style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center;">
          <h2 style="color: #444;">Sign in with Google</h2>
          <p>Connecting to PinGenius Agent...</p>
          <div style="margin-top: 20px; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #4285F4; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        </div>
      `);
      
      setTimeout(() => {
        popup.close();
        setUser(MOCK_USER);
      }, 1500);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size too large. Please upload an image under 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearReferenceImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoadingText(true);
    setLoadingImage(false);
    setError(null);
    setData(null);
    setGeneratedImage(null);

    try {
      // Step 1: Generate Text & Metadata (passing reference image)
      const result = await generatePinterestData(topic, category, style, referenceImage || undefined);
      setData(result);
      setLoadingText(false);

      // Step 2: Generate Image (passing reference image)
      setLoadingImage(true);
      const imageBase64 = await generatePinterestImage(result.image_prompt, referenceImage || undefined);
      setGeneratedImage(imageBase64);
    } catch (err) {
      setError("Failed to generate content. Please try again.");
      console.error(err);
    } finally {
      setLoadingText(false);
      setLoadingImage(false);
    }
  };

  const copyToClipboard = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedState(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedState(prev => ({ ...prev, [key]: false }));
    }, 2000);
  }, []);

  const handleDownloadText = () => {
    if (!data) return;

    const textContent = `
=== PinGenius Agent Generated Content ===
Date: ${new Date().toLocaleString()}
Topic: ${topic}
Category: ${category}
Style: ${style}

----------------------------------------
TITLE
----------------------------------------
${data.title}

----------------------------------------
DESCRIPTION
----------------------------------------
${data.description}

----------------------------------------
TAGS
----------------------------------------
${data.tags.join(', ')}

----------------------------------------
HASHTAGS
----------------------------------------
${data.hashtags.join(' ')}

----------------------------------------
ALT TEXT
----------------------------------------
${data.alt_text}

----------------------------------------
DESIGN BLUEPRINT
----------------------------------------
Structure: ${data.blueprint.layout_structure}
Typography: ${data.blueprint.fonts_typography}
Colors: ${data.blueprint.color_theme}
Visual Style: ${data.blueprint.visual_style}
Text Elements: ${data.blueprint.text_elements}

----------------------------------------
IMAGE PROMPT
----------------------------------------
${data.image_prompt}

----------------------------------------
EXPORT INSTRUCTIONS
----------------------------------------
${data.export_instructions}
`.trim();

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pin-content-${topic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 pb-20 font-sans">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#E60023] rounded-full flex items-center justify-center text-white shadow-md">
              <Sparkles size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">PinGenius <span className="text-[#E60023]">Agent</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            {!user ? (
               <button 
               onClick={handleGoogleLogin}
               className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
             >
               <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                 <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                 <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                 <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                 <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
               </svg>
               Sign in with Google
             </button>
            ) : (
              <div className="flex items-center gap-3">
                 <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                    <button onClick={() => setUser(null)} className="text-xs text-gray-500 hover:text-gray-700">Sign out</button>
                 </div>
                 <img src={user.avatar} alt="User" className="w-9 h-9 rounded-full border border-gray-200" />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h2 className="text-4xl font-extrabold mb-4 text-gray-900 tracking-tight">Create Viral Pins in Seconds</h2>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">Generate SEO titles, descriptions, and custom graphics tailored for Pinterest.</p>
          
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#E60023] focus:border-[#E60023] block p-3"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Visual Style</label>
                <select 
                  value={style} 
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#E60023] focus:border-[#E60023] block p-3"
                >
                  {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Reference Image Upload */}
            <div className="text-left">
              <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">Reference Image (Optional)</label>
              {!referenceImage ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center gap-3 text-gray-500 hover:border-[#E60023] hover:text-[#E60023] hover:bg-red-50 transition-all cursor-pointer h-16"
                >
                  <ImagePlus size={20} />
                  <span className="text-sm font-medium">Upload a design to copy style/layout</span>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              ) : (
                <div className="relative inline-block mt-1">
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 group">
                    <img src={referenceImage} alt="Reference" className="h-16 w-auto object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); clearReferenceImage(); }}
                        className="text-white hover:text-red-200"
                       >
                         <X size={20} />
                       </button>
                    </div>
                  </div>
                  <span className="text-xs text-green-600 font-medium ml-2 align-middle">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                    Reference Attached
                  </span>
                </div>
              )}
            </div>

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-gray-400 group-focus-within:text-[#E60023] transition-colors" />
              </div>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What is your Pin about? (e.g., 'Modern Living Room Ideas')"
                className="block w-full pl-14 pr-32 py-5 bg-white border border-gray-300 rounded-2xl text-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E60023] focus:border-transparent transition-all"
              />
              <button
                type="submit"
                disabled={loadingText || loadingImage || !topic.trim()}
                className="absolute right-3 top-3 bottom-3 bg-[#E60023] hover:bg-[#ad081b] text-white px-8 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                {loadingText ? <Loader2 className="animate-spin h-5 w-5" /> : 'Generate'}
              </button>
            </div>
          </form>
          {error && <p className="mt-4 text-red-500 text-sm font-medium bg-red-50 py-2 rounded-lg">{error}</p>}
        </div>

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
            <div className="lg:col-span-5 space-y-8 order-2 lg:order-1">
               <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col h-auto">
                 <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <ImageIcon size={20} className="text-[#E60023]" />
                     <h3 className="font-bold text-gray-900">Generated Pin</h3>
                   </div>
                   {generatedImage && (
                     <a href={generatedImage} download="pinterest-pin.png" className="text-xs bg-white border border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-full flex items-center gap-1 font-medium transition-colors text-gray-700">
                       <Download size={14} /> Save
                     </a>
                   )}
                 </div>
                 
                 <div className="bg-gray-100 min-h-[400px] flex items-center justify-center p-4 relative group">
                    {loadingImage ? (
                      <div className="text-center">
                        <Loader2 className="animate-spin w-12 h-12 text-[#E60023] mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Rendering 1000x1500 Image...</p>
                        <p className="text-xs text-gray-400 mt-2">Creating Ultra HD visuals</p>
                      </div>
                    ) : generatedImage ? (
                      <>
                        <img 
                          src={generatedImage} 
                          alt="Generated Pinterest Pin" 
                          className="w-full h-auto rounded-lg shadow-sm object-cover max-h-[600px]"
                          style={{ aspectRatio: '2/3' }}
                        />
                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">1000 x 1500</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center">
                         <ImageIcon size={48} className="mb-2 opacity-20" />
                         <span className="text-sm">Image generation failed</span>
                      </div>
                    )}
                 </div>
                 
                 <div className="p-4 bg-white border-t border-gray-100">
                    <div className="flex gap-2">
                       <button className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                          Edit in Canva
                       </button>
                    </div>
                 </div>
               </div>

               <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                 <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                     <Layout size={18} className="text-gray-500" />
                     <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Design Blueprint</h3>
                 </div>
                 <div className="p-6 space-y-5 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Structure</span>
                          <p className="text-gray-700 leading-snug">{data.blueprint.layout_structure}</p>
                       </div>
                       <div>
                          <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Typography</span>
                          <p className="text-gray-700 leading-snug">{data.blueprint.fonts_typography}</p>
                       </div>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Colors</span>
                          <p className="text-gray-700 leading-snug">{data.blueprint.color_theme}</p>
                       </div>
                       <div>
                          <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Style</span>
                          <p className="text-gray-700 leading-snug">{data.blueprint.visual_style}</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
              <div className="flex justify-end">
                <button
                  onClick={handleDownloadText}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <FileText size={16} />
                  Download Text Details
                </button>
              </div>

              <OutputSection 
                label="Pinterest Title (SEO)" 
                content={data.title}
                onCopy={() => copyToClipboard(data.title, 'title')}
                isCopied={copiedState['title']}
                className="border-l-4 border-l-[#E60023]"
              />

              <OutputSection 
                label="Description" 
                content={data.description}
                onCopy={() => copyToClipboard(data.description, 'description')}
                isCopied={copiedState['description']}
                multiline
              />

              <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
                 <OutputSection 
                  label={`Hashtags & Compliance (${data.hashtags.length})`}
                  content={
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {data.hashtags.map((tag, i) => {
                          const isMandatory = MANDATORY_HASHTAGS.includes(tag.toLowerCase());
                          return (
                            <span 
                              key={i} 
                              className={`px-2.5 py-1 text-xs font-medium rounded-full border flex items-center gap-1 transition-all ${
                                isMandatory 
                                  ? 'bg-red-50 text-red-700 border-red-200' 
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {isMandatory && <ShieldCheck size={12} />}
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300">
                         <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider flex items-center gap-2">
                            <ShieldCheck size={14} className="text-red-500" />
                            Disclosure Tags Included: #ads, #affiliate, #sponsored, #aigenerated
                         </p>
                      </div>
                    </div>
                  }
                  onCopy={() => copyToClipboard(data.hashtags.join(' '), 'hashtags')}
                  isCopied={copiedState['hashtags']}
                />
              </div>

              <OutputSection 
                label={`Search Engine Tags (${data.tags.length})`}
                content={
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                }
                onCopy={() => copyToClipboard(data.tags.join(', '), 'tags')}
                isCopied={copiedState['tags']}
              />

              <OutputSection 
                label="Alt Text" 
                content={data.alt_text}
                onCopy={() => copyToClipboard(data.alt_text, 'alt_text')}
                isCopied={copiedState['alt_text']}
              />

              <OutputSection 
                label="Export Instructions" 
                content={data.export_instructions}
                onCopy={() => copyToClipboard(data.export_instructions, 'export')}
                isCopied={copiedState['export']}
                multiline
              />

              <OutputSection 
                label="Automation JSON"
                content={
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                    {JSON.stringify(data.api_json, null, 2)}
                  </pre>
                }
                onCopy={() => copyToClipboard(JSON.stringify(data.api_json, null, 2), 'json')}
                isCopied={copiedState['json']}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;