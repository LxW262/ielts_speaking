import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { generateIELTSResponse, generateKeywords } from '../services/geminiService';
import { ArrowLeft, Loader2, Sparkles, Save, RefreshCw, ChevronDown } from 'lucide-react';

interface NewPracticeProps {
  onBack: () => void;
  onSuccess: (practiceId: string) => void;
  initialPart?: 'Part 1' | 'Part 2' | 'Part 3';
  initialTopic?: string;
}

export default function NewPractice({ onBack, onSuccess, initialPart, initialTopic }: NewPracticeProps) {
  const { user } = useAuth();
  const [part, setPart] = useState<'Part 1' | 'Part 2' | 'Part 3'>(initialPart || 'Part 1');
  const [topic, setTopic] = useState(initialTopic || '');
  const [existingTopics, setExistingTopics] = useState<string[]>([]);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [question, setQuestion] = useState('');
  const [chineseInput, setChineseInput] = useState('');
  const [englishResponse, setEnglishResponse] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    
    const fetchTopics = async () => {
      try {
        const q = query(
          collection(db, 'practices'),
          where('userId', '==', user.uid),
          where('part', '==', part)
        );
        const snapshot = await getDocs(q);
        const topics = new Set<string>();
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.topic) topics.add(data.topic);
        });
        setExistingTopics(Array.from(topics).sort());
      } catch (err) {
        console.error("Error fetching topics:", err);
      }
    };
    
    fetchTopics();
  }, [user, part]);

  const handleGenerate = async () => {
    if (!chineseInput.trim()) {
      setError('Please provide your Chinese answer or instructions first.');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await generateIELTSResponse(chineseInput, part, question);
      setEnglishResponse(response.englishResponse);
      setKeywords(response.keywords.join(', '));
    } catch (err: any) {
      console.error("Error generating response:", err);
      setError(err.message || 'Failed to generate response. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExtractKeywords = async () => {
    if (!englishResponse.trim()) {
      setError('Please provide an English response first.');
      return;
    }

    setIsExtracting(true);
    setError('');

    try {
      const extracted = await generateKeywords(englishResponse);
      setKeywords(extracted.join(', '));
    } catch (err: any) {
      console.error("Error extracting keywords:", err);
      setError(err.message || 'Failed to extract keywords. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!englishResponse.trim()) {
      setError('Please generate or type an English response before saving.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const practiceData: any = {
        userId: user.uid,
        part,
        topic: topic.trim() || 'General',
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
        englishResponse: englishResponse.trim(),
        createdAt: serverTimestamp(),
      };

      if (question.trim()) {
        practiceData.question = question.trim();
      }
      
      if (chineseInput.trim()) {
        practiceData.chineseInput = chineseInput.trim();
      }

      const docRef = await addDoc(collection(db, 'practices'), practiceData);
      onSuccess(docRef.id);
    } catch (err: any) {
      console.error("Error saving practice:", err);
      setError(err.message || 'Failed to save practice. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-800 mb-8 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#5A5A40] text-white p-3 rounded-xl">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-serif text-stone-800">New Practice</h2>
            <p className="text-stone-500">Generate from Chinese, or directly type your English response.</p>
          </div>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-800 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Input & Generation */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  IELTS Part
                </label>
                <div className="flex gap-2">
                  {['Part 1', 'Part 2', 'Part 3'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPart(p as any)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-sm transition-all ${
                        part === p
                          ? 'border-[#5A5A40] bg-[#5A5A40] text-white shadow-sm'
                          : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <label htmlFor="topic" className="block text-sm font-medium text-stone-700 mb-2">
                  Topic (e.g., Hometown, Work, Hobbies)
                </label>
                <div className="relative">
                  <input
                    id="topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onFocus={() => setShowTopicDropdown(true)}
                    onBlur={() => setTimeout(() => setShowTopicDropdown(false), 200)}
                    placeholder="e.g., Hometown"
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all"
                  />
                  {existingTopics.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowTopicDropdown(!showTopicDropdown)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      <ChevronDown size={20} />
                    </button>
                  )}
                </div>
                {showTopicDropdown && existingTopics.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {existingTopics.filter(t => t.toLowerCase().includes(topic.toLowerCase())).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTopic(t);
                          setShowTopicDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-stone-50 text-stone-700 transition-colors"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="question" className="block text-sm font-medium text-stone-700 mb-2">
                  Question (Optional)
                </label>
                <input
                  id="question"
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., Do you like reading?"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="chineseInput" className="block text-sm font-medium text-stone-700 mb-2">
                  Your Answer / Instructions (Optional)
                </label>
                <textarea
                  id="chineseInput"
                  value={chineseInput}
                  onChange={(e) => setChineseInput(e.target.value)}
                  placeholder="输入中文回答，或使用括号添加提示（如：[编一个关于去巴黎旅游的故事]）..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all resize-none"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !chineseInput.trim()}
                className="w-full bg-stone-800 text-white py-3 rounded-xl font-medium hover:bg-stone-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Generate English Response</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Column: English Response & Save */}
            <div className="space-y-6 flex flex-col h-full">
              <div className="flex-1 flex flex-col">
                <label htmlFor="englishResponse" className="block text-sm font-medium text-stone-700 mb-2">
                  English Response (Editable)
                </label>
                <textarea
                  id="englishResponse"
                  value={englishResponse}
                  onChange={(e) => setEnglishResponse(e.target.value)}
                  placeholder="The generated response will appear here. You can also directly type or paste your own English response..."
                  className="w-full flex-1 min-h-[200px] px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all resize-none font-serif leading-relaxed text-stone-800"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="keywords" className="block text-sm font-medium text-stone-700">
                    Keywords / Key Phrases (Comma separated)
                  </label>
                  <button
                    onClick={handleExtractKeywords}
                    disabled={isExtracting || !englishResponse.trim()}
                    className="text-xs flex items-center gap-1 text-[#5A5A40] hover:text-[#4a4a34] disabled:opacity-50 transition-colors"
                  >
                    {isExtracting ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                    Extract from English
                  </button>
                </div>
                <input
                  id="keywords"
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g., bustling city, out of the blue, to be honest"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-none transition-all"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving || !englishResponse.trim()}
                className="w-full bg-[#5A5A40] text-white py-4 rounded-xl font-medium hover:bg-[#4a4a34] transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span>Save Practice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
