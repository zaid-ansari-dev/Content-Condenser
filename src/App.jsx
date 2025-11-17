import React, { useState } from 'react';
import { Sparkles, FileText, Youtube, Upload, Loader2, Copy, Check } from 'lucide-react';

const COHERE_API_KEY = 'atTCSFryze3ElnjGtPnxZTPSThgY0tAN3BxzttDV';


const style = document.createElement('style');
style.textContent = `
  .shadow-neumorphic {
    box-shadow: 6px 6px 12px #b8c4d6, -6px -6px 12px #ffffff;
  }
  .shadow-neumorphic-large {
    box-shadow: 10px 10px 20px #b8c4d6, -10px -10px 20px #ffffff;
  }
`;
document.head.appendChild(style);

// Hardcoded YouTube summaries to avoid CORS
const YOUTUBE_SUMMARIES = {
  'dQw4w9WgXcQ': {
    title: 'Rick Astley - Never Gonna Give You Up',
    points: [
      'Classic 1987 pop hit by Rick Astley that became an internet phenomenon',
      'Features signature bass-heavy production and Astley\'s distinctive baritone voice',
      'Music video showcases 80s fashion and iconic dance moves',
      'Song\'s theme centers on unwavering commitment and loyalty in relationships',
      'Has achieved over 1.4 billion views, making it one of YouTube\'s most-watched videos'
    ],
    para: 'This iconic 1987 music video features Rick Astley\'s breakthrough hit that defined a generation and later became the centerpiece of internet culture\'s "Rickrolling" phenomenon. The song showcases Astley\'s distinctive deep voice against a backdrop of synthesized 80s production, while the video captures the era\'s aesthetic with its fashion choices and choreography. The lyrics express themes of faithful devotion and commitment, with Astley promising never to let down or desert his love interest. Its cultural impact has transcended its original release, becoming one of the most recognizable songs on the internet and accumulating over a billion views.'
  },
  'jNQXAC9IVRw': {
    title: 'Me at the zoo - First YouTube Video',
    points: [
      'The very first video ever uploaded to YouTube on April 23, 2005',
      'Features YouTube co-founder Jawed Karim at the San Diego Zoo',
      'Only 19 seconds long, showing elephants in the background',
      'Marked the beginning of what would become the world\'s largest video platform',
      'Has historical significance as the genesis of modern video sharing culture'
    ],
    para: 'This 19-second clip holds immense historical significance as the first video ever uploaded to YouTube on April 23, 2005. Co-founder Jawed Karim stands in front of the elephant enclosure at San Diego Zoo, casually commenting on the elephants\' long trunks. While seemingly mundane, this brief moment marked the birth of a platform that would revolutionize how humanity shares and consumes video content. The video\'s simplicity contrasts sharply with the sophisticated content that dominates YouTube today, serving as a humble reminder of the platform\'s origins and its journey from a simple video-sharing site to a global cultural phenomenon.'
  },
  '9bZkp7q19f0': {
    title: 'PSY - GANGNAM STYLE',
    points: [
      'First YouTube video to reach 1 billion views in December 2012',
      'Korean pop sensation that broke language barriers globally',
      'Features the iconic "horse-riding" dance move that went viral worldwide',
      'Music video showcases satirical take on Seoul\'s upscale Gangnam district',
      'Became a cultural phenomenon, influencing fashion, dance, and social media trends'
    ],
    para: 'Gangnam Style by South Korean artist PSY became a global phenomenon in 2012, shattering records and cultural boundaries to become the first YouTube video ever to reach 1 billion views. The music video presents a satirical commentary on the lavish lifestyle of Seoul\'s Gangnam district through absurdist humor and PSY\'s signature horse-riding dance. Its infectious beat, memorable choreography, and unapologetically quirky style resonated across languages and cultures, spawning countless parodies and dance covers worldwide. The song\'s success demonstrated the power of internet virality and proved that non-English content could achieve unprecedented global reach, forever changing the landscape of pop music and digital entertainment.'
  }
};

export default function ContentCondenser() {
  const [inputType, setInputType] = useState('text');
  const [textInput, setTextInput] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('points');
  const [copied, setCopied] = useState(false);

  const extractYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleYoutubeSummary = (url) => {
    const videoId = extractYoutubeId(url);
    if (videoId && YOUTUBE_SUMMARIES[videoId]) {
      return YOUTUBE_SUMMARIES[videoId];
    }
    return null;
  };

  const summarizeWithAI = async (content, type) => {
    if (!content || content.trim().length === 0) {
      throw new Error('Content is empty');
    }

    const prompt = type === 'youtube' 
      ? `Summarize this YouTube video content in ${format === 'points' ? 'bullet points (5-7 points)' : 'a concise paragraph'}: ${content}`
      : `Summarize the following content in ${format === 'points' ? 'bullet points (5-7 points)' : 'a concise paragraph'}:\n\n${content}`;

    if (!prompt || prompt.trim().length < 10) {
      throw new Error('Prompt is too short');
    }

    try {
      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${COHERE_API_KEY}`
        },
        body: JSON.stringify({
          stream: false,
          model: 'command-a-03-2025',
          message: prompt,
          chat_history: [],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.text) {
        return data.text.trim();
      } else {
        // Log the actual data to see what went wrong
        console.error('Unexpected API response:', data); 
        throw new Error('No response text from Cohere');
      }
    } catch (error) {
      console.error('API Error:', error);
      throw new Error('Failed to generate summary: ' + error.message);
    }
  };

  const handleSummarize = async () => {
    setLoading(true);
    setSummary(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (inputType === 'youtube') {
        const ytSummary = handleYoutubeSummary(youtubeUrl);
        if (ytSummary) {
          setSummary({
            title: ytSummary.title,
            content: format === 'points' ? ytSummary.points : ytSummary.para,
            type: 'youtube'
          });
        } else {
          setSummary({
            title: 'Video Analysis',
            content: format === 'points' 
              ? ['This YouTube URL is not in our demo database', 'Try one of these URLs:', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=jNQXAC9IVRw', 'https://www.youtube.com/watch?v=9bZkp7q19f0']
              : 'This YouTube URL is not in our demo database. Please try one of the hardcoded URLs provided: dQw4w9WgXcQ, jNQXAC9IVRw, or 9bZkp7q19f0',
            type: 'error'
          });
        }
      } else if (inputType === 'text' && textInput.trim()) {
        const aiSummary = await summarizeWithAI(textInput, 'text');
        setSummary({
          title: 'Text Summary',
          content: aiSummary,
          type: 'text'
        });
      } else if (inputType === 'file' && file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          let content = '';
          if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
            content = e.target.result;
          } else {
            content = `Analyzing ${file.type || 'file'}: ${file.name}`;
          }
          const aiSummary = await summarizeWithAI(content, 'file');
          setSummary({
            title: `Summary of ${file.name}`,
            content: aiSummary,
            type: 'file'
          });
        };
        reader.readAsText(file);
      }
    } catch (error) {
      console.error('Summarization Error:', error);
      setSummary({
        title: 'Error',
        content: format === 'points' 
          ? ['Failed to generate summary', 'Please check your Cohere API key', 'Ensure it has credits and access to command-r model', `API Error: ${error.message}`]
          : `Failed to generate summary: ${error.message}. Please check your Cohere API key, ensure it has credits, and has access to the 'command-r' model.`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const text = Array.isArray(summary.content) 
      ? summary.content.join('\n') 
      : summary.content;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gray-100 rounded-2xl shadow-neumorphic">
              <Sparkles className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-gray-800">
              Content Condenser
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Transform any content into digestible insights</p>
        </div>

        {/* Main Card */}
        <div className="bg-gray-100 rounded-3xl p-8 mb-8 shadow-neumorphic-large">
          {/* Input Type Selector */}
          <div className="flex flex-wrap gap-4 mb-8">
            {[
              { type: 'text', icon: FileText, label: 'Text' },
              { type: 'youtube', icon: Youtube, label: 'YouTube' },
              { type: 'file', icon: Upload, label: 'File' }
            ].map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => setInputType(type)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                  inputType === type
                    ? 'text-indigo-700'
                    : 'text-gray-600'
                }`}
                style={{
                  boxShadow: inputType === type
                    ? 'inset 6px 6px 12px #b8c4d6, inset -6px -6px 12px #ffffff'
                    : '6px 6px 12px #b8c4d6, -6px -6px 12px #ffffff'
                }}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>

          {/* Format Toggle */}
          <div className="flex items-center gap-4 mb-6 bg-gray-100 rounded-xl p-4 shadow-neumorphic">
            <span className="text-gray-700 font-medium">Output Format:</span>
            <div className="flex gap-3">
              {['points', 'para'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    format === f
                      ? 'text-indigo-700'
                      : 'text-gray-600'
                  }`}
                  style={{
                    boxShadow: format === f
                      ? 'inset 4px 4px 8px #b8c4d6, inset -4px -4px 8px #ffffff'
                      : '4px 4px 8px #b8c4d6, -4px -4px 8px #ffffff'
                  }}
                >
                  {f === 'points' ? 'Bullet Points' : 'Paragraph'}
                </button>
              ))}
            </div>
          </div>

          {/* Input Areas */}
          <div className="mb-6">
            {inputType === 'text' && (
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your text here... articles, essays, reports, anything!"
                className="w-full h-48 bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 resize-none transition-all duration-300"
                style={{
                  boxShadow: 'inset 6px 6px 12px #b8c4d6, inset -6px -6px 12px #ffffff'
                }}
              />
            )}

            {inputType === 'youtube' && (
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Paste YouTube URL here..."
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-400 shadow-inner transition-all duration-300"
                style={{
                  boxShadow: 'inset 6px 6px 12px #d1d9e6, inset -6px -6px 12px #ffffff'
                }}
              />
            )}

            {inputType === 'file' && (
              <div>
                <label className="block w-full">
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-indigo-400 transition-all duration-300 cursor-pointer bg-gray-50"
                    style={{
                      boxShadow: 'inset 4px 4px 8px #b8c4d6, inset -4px -4px 8px #ffffff'
                    }}
                  >
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-700 font-medium mb-2">
                      {file ? file.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-gray-500 text-sm">PDF, DOC, TXT, Images, Audio, Video</p>
                  </div>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.mp3,.mp4,.wav"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Condense Button */}
          <button
            onClick={handleSummarize}
            disabled={loading || (inputType === 'text' && !textInput.trim()) || (inputType === 'youtube' && !youtubeUrl.trim()) || (inputType === 'file' && !file)}
            className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3"
            style={{
              boxShadow: loading || (inputType === 'text' && !textInput.trim()) || (inputType === 'youtube' && !youtubeUrl.trim()) || (inputType === 'file' && !file)
                ? 'none'
                : '8px 8px 16px #b8c4d6, -8px -8px 16px #ffffff'
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                Condense Content
              </>
            )}
          </button>
        </div>

        {/* Summary Output */}
        {summary && (
          <div className="bg-gray-100 rounded-3xl p-8 shadow-neumorphic-large animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {summary.title}
              </h2>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 text-gray-700 font-medium"
                style={{
                  boxShadow: copied
                    ? 'inset 4px 4px 8px #b8c4d6, inset -4px -4px 8px #ffffff'
                    : '4px 4px 8px #b8c4d6, -4px -4px 8px #ffffff'
                }}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6"
              style={{
                boxShadow: 'inset 4px 4px 8px #b8c4d6, inset -4px -4px 8px #ffffff'
              }}
            >
              {Array.isArray(summary.content) ? (
                <ul className="space-y-3">
                  {summary.content.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-700">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold mt-0.5 shadow-md">
                        {idx + 1}
                      </span>
                      <span className="flex-1">{point}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700 leading-relaxed">{summary.content}</p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Made by zaid-ansari-dev</p>
        </div>
      </div>
    </div>
  );
}