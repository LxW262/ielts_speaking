import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Practice } from '../types';
import { format } from 'date-fns';
import { Plus, Trash2, Mic, PlayCircle, BookOpen, Folder, ChevronDown, ChevronRight } from 'lucide-react';

interface DashboardProps {
  onNewPractice: () => void;
  onViewPractice: (practice: Practice) => void;
}

export default function Dashboard({ onNewPractice, onViewPractice }: DashboardProps) {
  const { user } = useAuth();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePart, setActivePart] = useState<'Part 1' | 'Part 2' | 'Part 3'>('Part 1');
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'practices'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Practice[];
      setPractices(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching practices:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const groupedPractices = useMemo(() => {
    const grouped: Record<string, Record<string, Practice[]>> = {
      'Part 1': {},
      'Part 2': {},
      'Part 3': {}
    };

    practices.forEach(p => {
      const part = p.part || 'Part 1';
      const topic = p.topic || 'General';
      if (!grouped[part]) grouped[part] = {};
      if (!grouped[part][topic]) grouped[part][topic] = [];
      grouped[part][topic].push(p);
    });

    return grouped;
  }, [practices]);

  const toggleTopic = (topic: string) => {
    setExpandedTopics(prev => ({ ...prev, [topic]: !prev[topic] }));
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this practice?')) {
      try {
        await deleteDoc(doc(db, 'practices', id));
      } catch (error) {
        console.error("Error deleting practice:", error);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-stone-500">Loading your practices...</div>;
  }

  const currentPartTopics = groupedPractices[activePart];
  const topics = Object.keys(currentPartTopics).sort();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif text-stone-800 mb-2">My Speaking Practices</h1>
          <p className="text-stone-500">Review and practice your IELTS speaking responses.</p>
        </div>
        <button
          onClick={onNewPractice}
          className="bg-[#5A5A40] text-white px-6 py-3 rounded-full flex items-center gap-2 hover:bg-[#4a4a34] transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>New Practice</span>
        </button>
      </div>

      {practices.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-stone-100">
          <div className="bg-stone-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mic className="text-stone-400" size={32} />
          </div>
          <h3 className="text-xl font-medium text-stone-800 mb-2">No practices yet</h3>
          <p className="text-stone-500 mb-6 max-w-md mx-auto">
            Start by adding a new practice. Input your Chinese answer, and get a high-scoring English response with native pronunciation.
          </p>
          <button
            onClick={onNewPractice}
            className="text-[#5A5A40] font-medium hover:underline"
          >
            Create your first practice &rarr;
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-6 mb-8 border-b border-stone-200">
            {(['Part 1', 'Part 2', 'Part 3'] as const).map(part => (
              <button
                key={part}
                onClick={() => setActivePart(part)}
                className={`pb-4 px-2 font-medium transition-colors relative ${
                  activePart === part ? 'text-[#5A5A40]' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                {part}
                {activePart === part && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#5A5A40] rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {topics.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              No practices found for {activePart}.
            </div>
          ) : (
            <div className="space-y-6">
              {topics.map(topic => {
                const isExpanded = expandedTopics[topic] !== false; // Default to true
                return (
                  <div key={topic} className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
                    <button
                      onClick={() => toggleTopic(topic)}
                      className="w-full px-6 py-4 flex items-center justify-between bg-stone-50 hover:bg-stone-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Folder className="text-[#5A5A40]" size={20} />
                        <h3 className="font-medium text-stone-800 capitalize">{topic}</h3>
                        <span className="text-xs text-stone-500 bg-stone-200 px-2 py-0.5 rounded-full font-medium">
                          {currentPartTopics[topic].length}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown size={20} className="text-stone-400" />
                      ) : (
                        <ChevronRight size={20} className="text-stone-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="divide-y divide-stone-100">
                        {currentPartTopics[topic].map(practice => (
                          <div
                            key={practice.id}
                            onClick={() => onViewPractice(practice)}
                            className="p-4 hover:bg-stone-50 cursor-pointer flex justify-between items-center group transition-colors"
                          >
                            <div className="flex-1 min-w-0 pr-6">
                              <h4 className="text-stone-800 font-medium truncate mb-1">
                                {practice.question || 'No Question Provided'}
                              </h4>
                              {practice.keywords && practice.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {practice.keywords.slice(0, 3).map((kw, idx) => (
                                    <span key={idx} className="text-[10px] font-medium px-2 py-0.5 bg-[#5A5A40]/10 text-[#5A5A40] rounded-md truncate max-w-[120px]">
                                      {kw}
                                    </span>
                                  ))}
                                  {practice.keywords.length > 3 && (
                                    <span className="text-[10px] font-medium px-2 py-0.5 bg-stone-100 text-stone-500 rounded-md">
                                      +{practice.keywords.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                              <p className="text-stone-500 text-sm truncate">
                                {practice.chineseInput || practice.englishResponse}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <span className="text-stone-400 text-xs font-medium">
                                {format(practice.createdAt?.toDate ? practice.createdAt.toDate() : new Date(practice.createdAt || Date.now()), 'MMM d')}
                              </span>
                              <button
                                onClick={(e) => handleDelete(practice.id, e)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
