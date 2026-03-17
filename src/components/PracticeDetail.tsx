import { useState, useRef, useEffect } from 'react';
import { Practice } from '../types';
import { generateTTS } from '../services/geminiService';
import { ArrowLeft, Play, Pause, Loader2, Quote, Edit2, Save, X, Tag, Folder } from 'lucide-react';
import { format } from 'date-fns';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface PracticeDetailProps {
  practice: Practice;
  onBack: () => void;
}

export default function PracticeDetail({ practice, onBack }: PracticeDetailProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editTopic, setEditTopic] = useState(practice.topic || '');
  const [editKeywords, setEditKeywords] = useState(practice.keywords?.join(', ') || '');
  const [editQuestion, setEditQuestion] = useState(practice.question || '');
  const [editChineseInput, setEditChineseInput] = useState(practice.chineseInput || '');
  const [editEnglishResponse, setEditEnglishResponse] = useState(practice.englishResponse || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup audio URL on unmount
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handlePlayPause = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioUrl) {
      audioRef.current?.play();
      setIsPlaying(true);
      return;
    }

    setIsLoadingAudio(true);
    setError('');

    try {
      const base64Audio = await generateTTS(practice.englishResponse);
      
      // Convert base64 to blob
      const binaryString = window.atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      setAudioUrl(url);
      
      // Play audio
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err: any) {
      console.error("Error playing audio:", err);
      setError('Failed to generate audio. Please try again.');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const practiceRef = doc(db, 'practices', practice.id);
      const updatedKeywords = editKeywords.split(',').map(k => k.trim()).filter(k => k);
      const updatedTopic = editTopic.trim() || 'General';
      const updatedQuestion = editQuestion.trim();
      const updatedChineseInput = editChineseInput.trim();
      const updatedEnglishResponse = editEnglishResponse.trim();
      
      await updateDoc(practiceRef, {
        topic: updatedTopic,
        keywords: updatedKeywords,
        question: updatedQuestion,
        chineseInput: updatedChineseInput,
        englishResponse: updatedEnglishResponse
      });
      
      // Update local state to reflect changes immediately without full reload
      practice.topic = updatedTopic;
      practice.keywords = updatedKeywords;
      practice.question = updatedQuestion;
      practice.chineseInput = updatedChineseInput;
      practice.englishResponse = updatedEnglishResponse;
      
      // Clear audio URL since the response might have changed
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating practice:", err);
      setError("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-800 mb-8 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100">
        {/* Header Section */}
        <div className="bg-stone-50 p-8 border-b border-stone-100 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-white text-stone-600 rounded-full text-xs font-medium uppercase tracking-wider shadow-sm">
                {practice.part}
              </span>
              <span className="text-stone-400 text-sm">
                {format(practice.createdAt?.toDate ? practice.createdAt.toDate() : new Date(practice.createdAt || Date.now()), 'MMMM d, yyyy')}
              </span>
            </div>
            
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 text-sm font-medium transition-colors bg-white px-3 py-1.5 rounded-full shadow-sm border border-stone-100"
              >
                <Edit2 size={14} />
                <span>Edit Details</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1.5 text-stone-500 hover:text-stone-800 text-sm font-medium transition-colors bg-white px-3 py-1.5 rounded-full shadow-sm border border-stone-100"
                >
                  <X size={14} />
                  <span>Cancel</span>
                </button>
                <button 
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 text-white bg-[#5A5A40] hover:bg-[#4a4a34] text-sm font-medium transition-colors px-3 py-1.5 rounded-full shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <input
              type="text"
              value={editQuestion}
              onChange={(e) => setEditQuestion(e.target.value)}
              placeholder="Question"
              className="w-full text-2xl font-serif text-stone-800 mb-4 px-3 py-2 rounded-lg border border-stone-200 bg-white focus:border-[#5A5A40] outline-none"
            />
          ) : (
            <h2 className="text-2xl font-serif text-stone-800 mb-4">
              {practice.question || 'No Question Provided'}
            </h2>
          )}

          {isEditing ? (
            <div className="space-y-4 bg-white p-4 rounded-xl border border-stone-200 shadow-sm mb-4">
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Topic</label>
                <input
                  type="text"
                  value={editTopic}
                  onChange={(e) => setEditTopic(e.target.value)}
                  placeholder="e.g., Hometown"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-[#5A5A40] outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Keywords / Key Phrases (Comma separated)</label>
                <input
                  type="text"
                  value={editKeywords}
                  onChange={(e) => setEditKeywords(e.target.value)}
                  placeholder="e.g., bustling city, out of the blue"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:border-[#5A5A40] outline-none text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {practice.topic && practice.topic !== 'General' && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-stone-200 text-stone-700 rounded-lg text-sm font-medium">
                  <Folder size={14} />
                  {practice.topic}
                </span>
              )}
              {practice.keywords && practice.keywords.length > 0 && practice.keywords.map((kw, idx) => (
                <span key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-[#5A5A40]/10 text-[#5A5A40] rounded-lg text-sm font-medium">
                  <Tag size={14} />
                  {kw}
                </span>
              ))}
            </div>
          )}

          {isEditing ? (
            <div className="mt-4">
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">Your Input / Instructions</label>
              <textarea
                value={editChineseInput}
                onChange={(e) => setEditChineseInput(e.target.value)}
                placeholder="Your Chinese answer or instructions..."
                className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white focus:border-[#5A5A40] outline-none text-sm min-h-[80px] resize-y"
              />
            </div>
          ) : practice.chineseInput && (
            <div className="bg-white p-4 rounded-xl text-stone-600 text-sm border border-stone-100 mt-4">
              <p className="font-medium text-stone-400 mb-1 uppercase text-xs tracking-wider">Your Input / Instructions</p>
              <p>{practice.chineseInput}</p>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium text-stone-800 flex items-center gap-2">
              <Quote size={20} className="text-[#5A5A40]" />
              High-Scoring Response
            </h3>

            <div className="flex items-center gap-4">
              {error && <span className="text-red-500 text-sm">{error}</span>}
              <button
                onClick={handlePlayPause}
                disabled={isLoadingAudio}
                className="flex items-center gap-2 bg-[#5A5A40] text-white px-6 py-3 rounded-full hover:bg-[#4a4a34] transition-colors shadow-sm disabled:opacity-70"
              >
                {isLoadingAudio ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : isPlaying ? (
                  <Pause size={20} />
                ) : (
                  <Play size={20} className="ml-1" />
                )}
                <span className="font-medium">
                  {isLoadingAudio ? 'Generating Audio...' : isPlaying ? 'Pause' : 'Listen'}
                </span>
              </button>
            </div>
          </div>

          <div className="prose prose-stone max-w-none">
            {isEditing ? (
              <textarea
                value={editEnglishResponse}
                onChange={(e) => setEditEnglishResponse(e.target.value)}
                placeholder="English Response..."
                className="w-full min-h-[300px] p-4 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-[#5A5A40] outline-none text-lg leading-relaxed text-stone-700 font-serif resize-y"
              />
            ) : (
              <p className="text-lg leading-relaxed text-stone-700 whitespace-pre-wrap font-serif">
                {practice.englishResponse}
              </p>
            )}
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        className="hidden"
      />
    </div>
  );
}
