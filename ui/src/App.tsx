import { useState, useEffect, useRef } from 'react';
import { templates, templateNames } from './templates';

interface Scene {
  id: string;
  template: string;
  duration: number;
  data: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  transition?: {
    type: 'cut' | 'fade';
    duration: number;
  };
}

interface Theme {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoPath?: string;
}

interface Meta {
  title: string;
  resolution: { width: number; height: number };
  fps: number;
  outputPath: string;
}

const defaultTemplatesData: Record<string, Record<string, any>> = { // eslint-disable-line @typescript-eslint/no-explicit-any
  'title-card': { title: 'Welcome to VideoForge', subtitle: 'AI-assisted motion graphics generator' },
  'feature-grid': {
    title: 'Key Features',
    features: [
      { title: 'Local-First', description: 'Runs 100% offline on your machine.' },
      { title: 'AI Storyboards', description: 'Generates scenes from markdown.' },
    ],
  },
  'code-snippet': {
    title: 'TypeScript SDK Usage',
    code: "import { renderProject } from 'videoforge';\n\nawait renderProject(config);",
    language: 'typescript',
  },
  'logo-reveal': { title: 'VideoForge', subtitle: 'Cinematic Motion Graphics' },
  'stat-counter': { number: 99, suffix: '%', title: 'Accuracy Score', subtitle: 'Verified locally' },
  'quote': { quote: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci', title: 'Artist & Inventor' },
  'outro': { tagline: 'Start building today!', link: 'github.com/videoforge/videoforge' },
};

export default function App() {
  const [meta, setMeta] = useState<Meta>({
    title: 'My VideoForge Project',
    resolution: { width: 1280, height: 720 },
    fps: 30,
    outputPath: './output/video.mp4',
  });

  const [theme, setTheme] = useState<Theme>({
    primaryColor: '#1a1a2e',
    secondaryColor: '#e94560',
    fontFamily: 'sans-serif',
    logoPath: './logo.svg',
  });

  const [scenes, setScenes] = useState<Scene[]>([
    {
      id: 'scene-1',
      template: 'title-card',
      duration: 3,
      data: { ...defaultTemplatesData['title-card'] },
      transition: { type: 'fade', duration: 1 },
    },
  ]);

  const [selectedSceneId, setSelectedSceneId] = useState<string | null>('scene-1');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // Job status state
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<'pending' | 'rendering' | 'completed' | 'failed' | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [renderedOutputPath, setRenderedOutputPath] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeTemplateInstance = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const selectedScene = scenes.find((s) => s.id === selectedSceneId) || null;

  // Load sample project seeder
  const loadSampleProject = () => {
    setMeta({
      title: 'Showcase Project',
      resolution: { width: 1280, height: 720 },
      fps: 30,
      outputPath: './output/showcase.mp4',
    });
    setTheme({
      primaryColor: '#0f0f1b',
      secondaryColor: '#38bdf8',
      fontFamily: 'sans-serif',
      logoPath: './logo.svg',
    });
    setScenes([
      {
        id: 's1',
        template: 'title-card',
        duration: 3,
        data: { title: 'VideoForge Engine', subtitle: 'Stunning animations rendered locally' },
        transition: { type: 'fade', duration: 1 },
      },
      {
        id: 's2',
        template: 'feature-grid',
        duration: 4,
        data: {
          title: 'Unbelievable Features',
          features: [
            { title: 'Playwright headlessly', description: 'Chromium capture at 1080p.' },
            { title: 'HTML5/Canvas', description: 'Linear blending transition effects.' },
            { title: 'FFmpeg encoding', description: 'High quality compression output.' },
          ],
        },
        transition: { type: 'fade', duration: 1 },
      },
      {
        id: 's3',
        template: 'code-snippet',
        duration: 4,
        data: {
          title: 'Easy API invocation',
          code: "import { loadConfig, renderProject } from 'videoforge';\n\nconst config = loadConfig('./config.yaml');\nawait renderProject(config);",
          language: 'typescript',
        },
        transition: { type: 'fade', duration: 1 },
      },
      {
        id: 's4',
        template: 'stat-counter',
        duration: 3.5,
        data: { number: 100, suffix: '%', title: 'Open-Source', subtitle: 'Free to customize and host' },
        transition: { type: 'fade', duration: 1 },
      },
      {
        id: 's5',
        template: 'quote',
        duration: 4,
        data: { quote: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci', title: 'Polymath' },
        transition: { type: 'fade', duration: 1 },
      },
      {
        id: 's6',
        template: 'outro',
        duration: 3,
        data: { tagline: 'Get started on GitHub!', link: 'github.com/videoforge/videoforge' },
      },
    ]);
    setSelectedSceneId('s1');
  };

  // Preview Loop logic
  useEffect(() => {
    if (!containerRef.current || !selectedScene) return;
    const container = containerRef.current;
    container.innerHTML = '';

    const TemplateClass = templates[selectedScene.template];
    if (!TemplateClass) return;

    const instance = new TemplateClass();
    activeTemplateInstance.current = instance;

    // Apply basic font/theme variables to container
    container.style.fontFamily = theme.fontFamily;
    container.style.backgroundColor = theme.primaryColor;
    container.style.color = '#ffffff';

    // Mount template
    instance.mount(container, selectedScene.data, theme);

    let animationFrameId: number;
    const duration = instance.getDuration() || selectedScene.duration || 3;
    const startTime = performance.now();

    const tick = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const currentVirtualTime = elapsed % duration;
      instance.seek(currentVirtualTime);
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (instance.destroy) {
        instance.destroy();
      }
      activeTemplateInstance.current = null;
    };
  }, [selectedSceneId, selectedScene?.template, selectedScene?.data, theme]);

  // Handle Drag & Drop reordering
  const handleDragStart = (_e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const reordered = [...scenes];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, moved);
    setScenes(reordered);
    setDraggedIndex(null);
  };

  // Scene Operations
  const addScene = () => {
    const id = 'scene-' + Date.now().toString(36);
    const newScene: Scene = {
      id,
      template: 'title-card',
      duration: 3,
      data: { ...defaultTemplatesData['title-card'] },
      transition: { type: 'cut', duration: 0 },
    };
    setScenes([...scenes, newScene]);
    setSelectedSceneId(id);
  };

  const deleteScene = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = scenes.filter((s) => s.id !== id);
    setScenes(updated);
    if (selectedSceneId === id) {
      setSelectedSceneId(updated[0]?.id || null);
    }
  };

  const updateSceneData = (field: string, value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!selectedSceneId) return;
    setScenes(
      scenes.map((s) => {
        if (s.id === selectedSceneId) {
          return {
            ...s,
            data: { ...s.data, [field]: value },
          };
        }
        return s;
      })
    );
  };

  const updateSceneMeta = (field: keyof Scene, value: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!selectedSceneId) return;
    setScenes(
      scenes.map((s) => {
        if (s.id === selectedSceneId) {
          return { ...s, [field]: value };
        }
        return s;
      })
    );
  };

  const swapTemplate = (templateName: string) => {
    if (!selectedSceneId) return;
    setScenes(
      scenes.map((s) => {
        if (s.id === selectedSceneId) {
          return {
            ...s,
            template: templateName,
            data: { ...defaultTemplatesData[templateName] },
          };
        }
        return s;
      })
    );
  };

  // Render video async execution
  const triggerRender = async () => {
    setJobId(null);
    setJobStatus('pending');
    setJobError(null);
    setRenderedOutputPath(null);

    const config = {
      meta,
      theme,
      scenes,
    };

    try {
      // Direct call to local server API endpoint (relies on running on the same domain/port, or absolute fallback)
      const baseUrl = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
        ? window.location.origin
        : 'http://127.0.0.1:3000';

      const res = await fetch(`${baseUrl}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Server render request failed');
      }

      const data = await res.json();
      setJobId(data.jobId);
      setJobStatus(data.status);
    } catch (err) {
      const error = err as Error;
      setJobStatus('failed');
      setJobError(error.message);
    }
  };

  // Poll Job Status
  useEffect(() => {
    if (!jobId || jobStatus === 'completed' || jobStatus === 'failed') return;

    const interval = setInterval(async () => {
      const baseUrl = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
        ? window.location.origin
        : 'http://127.0.0.1:3000';

      try {
        const res = await fetch(`${baseUrl}/jobs/${jobId}`);
        if (res.ok) {
          const data = await res.json();
          setJobStatus(data.status);
          if (data.status === 'completed') {
            setRenderedOutputPath(data.outputPath);
            clearInterval(interval);
          } else if (data.status === 'failed') {
            setJobError(data.error || 'Unknown rendering error');
            clearInterval(interval);
          }
        }
      } catch (err) {
        const error = err as Error;
        setJobStatus('failed');
        setJobError(`Polling failed: ${error.message}`);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [jobId, jobStatus]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      {/* Top Bar Header */}
      <header
        className="glass-panel"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          margin: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '6px 12px',
              backgroundColor: theme.secondaryColor,
              color: '#0b0b0f',
              borderRadius: '6px',
              fontWeight: 'bold',
            }}
          >
            VideoForge Studio
          </div>
          <input
            style={{ width: '250px', border: 'none', background: 'transparent', fontSize: '18px', fontWeight: 'bold' }}
            value={meta.title}
            onChange={(e) => setMeta({ ...meta, title: e.target.value })}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={loadSampleProject}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: '#1f1f2e',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ★ Seed Showcase Demo
          </button>
          <button
            onClick={triggerRender}
            className="glow-btn"
            style={{ padding: '8px 20px', borderRadius: '6px', cursor: 'pointer' }}
          >
            🎬 Render Video
          </button>
        </div>
      </header>

      {/* Main Workspace Workspace */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: '0 12px 12px 12px', gap: '12px' }}>
        
        {/* Left Panel: Scenes List */}
        <div
          className="glass-panel"
          style={{ width: '320px', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px' }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#94a3b8' }}>Animated Scenes</h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => setSelectedSceneId(scene.id)}
                className={`scene-card glass-panel ${selectedSceneId === scene.id ? 'selected' : ''}`}
                style={{
                  padding: '12px',
                  position: 'relative',
                  border: '1px solid rgba(255,255,255,0.05)',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: theme.secondaryColor, fontWeight: 'bold', textTransform: 'uppercase' }}>
                    #{index + 1} - {scene.template}
                  </span>
                  <button
                    onClick={(e) => deleteScene(scene.id, e)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    🗑
                  </button>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {scene.data.title || scene.data.tagline || scene.data.quote || 'Empty Scene'}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                  Duration: {scene.duration}s | Transition: {scene.transition?.type || 'cut'} ({scene.transition?.duration || 0}s)
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addScene}
            style={{
              marginTop: '16px',
              padding: '10px',
              backgroundColor: '#e94560',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            ＋ Add Scene
          </button>
        </div>

        {/* Center Panel: Preview Canvas */}
        <div
          className="glass-panel"
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px' }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#94a3b8' }}>Live Browser Preview</h3>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#040406',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.03)',
              position: 'relative',
            }}
          >
            {/* The actual viewport container matching 16:9 1280x720 scaled down */}
            <div
              style={{
                width: '1280px',
                height: '720px',
                transform: 'scale(0.5)',
                transformOrigin: 'center center',
                position: 'absolute',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              }}
            >
              <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />
            </div>
          </div>
          
          {/* Loop Timeline Status */}
          {selectedScene && (
            <div style={{ marginTop: '16px', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
                <span>Scene Preview Duration: {selectedScene.duration}s</span>
                <span>Active Template: {selectedScene.template}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Scene editor form */}
        <div
          className="glass-panel"
          style={{ width: '380px', display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '16px' }}
        >
          {selectedScene ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#94a3b8' }}>Edit Scene</h3>
                <label>Template Type</label>
                <select value={selectedScene.template} onChange={(e) => swapTemplate(e.target.value)}>
                  {templateNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Scene Duration (Seconds)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={selectedScene.duration}
                  onChange={(e) => updateSceneMeta('duration', parseFloat(e.target.value) || 3)}
                />
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#e94560' }}>Template Parameters</h4>
                
                {/* Dynamically build form inputs depending on selected template type */}
                {selectedScene.template === 'title-card' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label>Title</label>
                      <input
                        value={selectedScene.data.title || ''}
                        onChange={(e) => updateSceneData('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Subtitle</label>
                      <input
                        value={selectedScene.data.subtitle || ''}
                        onChange={(e) => updateSceneData('subtitle', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {selectedScene.template === 'logo-reveal' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label>Title</label>
                      <input
                        value={selectedScene.data.title || ''}
                        onChange={(e) => updateSceneData('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Subtitle</label>
                      <input
                        value={selectedScene.data.subtitle || ''}
                        onChange={(e) => updateSceneData('subtitle', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {selectedScene.template === 'outro' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label>Tagline</label>
                      <input
                        value={selectedScene.data.tagline || ''}
                        onChange={(e) => updateSceneData('tagline', e.target.value)}
                      />
                    </div>
                    <div>
                      <label>CTA Link</label>
                      <input
                        value={selectedScene.data.link || ''}
                        onChange={(e) => updateSceneData('link', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {selectedScene.template === 'quote' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label>Quote Content</label>
                      <textarea
                        rows={3}
                        value={selectedScene.data.quote || ''}
                        onChange={(e) => updateSceneData('quote', e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Author</label>
                      <input
                        value={selectedScene.data.author || ''}
                        onChange={(e) => updateSceneData('author', e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Author Title / Position</label>
                      <input
                        value={selectedScene.data.title || ''}
                        onChange={(e) => updateSceneData('title', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {selectedScene.template === 'stat-counter' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label>Number Value</label>
                      <input
                        type="number"
                        value={selectedScene.data.number || 0}
                        onChange={(e) => updateSceneData('number', parseInt(e.target.value, 10) || 0)}
                      />
                    </div>
                    <div>
                      <label>Suffix (e.g. %, +)</label>
                      <input
                        value={selectedScene.data.suffix || ''}
                        onChange={(e) => updateSceneData('suffix', e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Label Title</label>
                      <input
                        value={selectedScene.data.title || ''}
                        onChange={(e) => updateSceneData('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Subtitle Description</label>
                      <input
                        value={selectedScene.data.subtitle || ''}
                        onChange={(e) => updateSceneData('subtitle', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {selectedScene.template === 'code-snippet' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label>Title</label>
                      <input
                        value={selectedScene.data.title || ''}
                        onChange={(e) => updateSceneData('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Language</label>
                      <input
                        value={selectedScene.data.language || 'javascript'}
                        onChange={(e) => updateSceneData('language', e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Code</label>
                      <textarea
                        rows={6}
                        style={{ fontFamily: 'monospace' }}
                        value={selectedScene.data.code || ''}
                        onChange={(e) => updateSceneData('code', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {selectedScene.template === 'feature-grid' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label>Title</label>
                      <input
                        value={selectedScene.data.title || ''}
                        onChange={(e) => updateSceneData('title', e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Features Cards (Max 3)</label>
                      {(selectedScene.data.features || []).map((feat: { title?: string; description?: string }, idx: number) => (
                        <div key={idx} style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', marginBottom: '8px' }}>
                          <input
                            placeholder="Title"
                            style={{ marginBottom: '6px' }}
                            value={feat.title || ''}
                            onChange={(e) => {
                              const copy = [...selectedScene.data.features];
                              copy[idx].title = e.target.value;
                              updateSceneData('features', copy);
                            }}
                          />
                          <input
                            placeholder="Description"
                            value={feat.description || ''}
                            onChange={(e) => {
                              const copy = [...selectedScene.data.features];
                              copy[idx].description = e.target.value;
                              updateSceneData('features', copy);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Transition Settings */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#e94560' }}>Scene Transition</h4>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label>Type</label>
                    <select
                      value={selectedScene.transition?.type || 'cut'}
                      onChange={(e) =>
                        updateSceneMeta('transition', {
                          type: e.target.value,
                          duration: selectedScene.transition?.duration || 0,
                        })
                      }
                    >
                      <option value="cut">Cut (Instant)</option>
                      <option value="fade">Fade (Crossfade)</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label>Duration (s)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={selectedScene.transition?.duration || 0}
                      onChange={(e) =>
                        updateSceneMeta('transition', {
                          type: selectedScene.transition?.type || 'cut',
                          duration: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#64748b', textAlign: 'center', marginTop: '40px' }}>
              Select a scene to start editing parameters
            </div>
          )}

          {/* Global Theme Settings */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '24px', paddingTop: '16px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#94a3b8' }}>Global Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label>Primary Brand Color</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="color"
                    style={{ width: '40px', padding: '0', height: '36px', cursor: 'pointer' }}
                    value={theme.primaryColor}
                    onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  />
                  <input
                    value={theme.primaryColor}
                    onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label>Secondary Brand Color</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="color"
                    style={{ width: '40px', padding: '0', height: '36px', cursor: 'pointer' }}
                    value={theme.secondaryColor}
                    onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                  />
                  <input
                    value={theme.secondaryColor}
                    onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Render job progress overlay modal */}
      {jobStatus && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '450px',
              padding: '30px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h3 style={{ margin: 0, color: '#ff4a5a' }}>Rendering Status</h3>
            
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              {jobStatus === 'pending' && '⏳ Initializing job...'}
              {jobStatus === 'rendering' && '🎬 Rendering frames via Headless browser...'}
              {jobStatus === 'completed' && '🎉 Rendering completed successfully!'}
              {jobStatus === 'failed' && '❌ Rendering failed!'}
            </div>

            {jobError && (
              <div
                style={{
                  padding: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  borderRadius: '6px',
                  fontSize: '13px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  textAlign: 'left',
                }}
              >
                {jobError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', gap: '12px' }}>
              {jobStatus === 'completed' && renderedOutputPath && (
                <a
                  href={`http://127.0.0.1:3000/output/${pathNameOnly(renderedOutputPath)}`}
                  download
                  className="glow-btn"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    display: 'inline-block',
                  }}
                >
                  📥 Download MP4 Video
                </a>
              )}
              
              <button
                onClick={() => {
                  setJobId(null);
                  setJobStatus(null);
                  setJobError(null);
                }}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  backgroundColor: '#1f1f2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer',
                  color: '#fff',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function pathNameOnly(filePath: string): string {
  // Extract output file name from path
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1];
}
