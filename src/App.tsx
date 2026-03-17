import { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { ErrorBoundary } from './ErrorBoundary';
import Dashboard from './components/Dashboard';
import NewPractice from './components/NewPractice';
import PracticeDetail from './components/PracticeDetail';
import { Practice } from './types';
import { LogOut, User as UserIcon } from 'lucide-react';

type ViewState = 'dashboard' | 'new' | 'detail';

function MainLayout() {
  const { user, loading, signIn, logOut } = useAuth();
  const [view, setView] = useState<ViewState>('dashboard');
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="animate-pulse text-stone-500 font-serif text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-sm text-center">
          <div className="w-20 h-20 bg-[#5A5A40] rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
            <span className="text-white font-serif text-3xl font-bold">I</span>
          </div>
          <h1 className="text-3xl font-serif text-stone-800 mb-2">IELTS Speaking</h1>
          <p className="text-stone-500 mb-8">
            Your personal AI examiner for high-scoring spoken English.
          </p>
          <div className="text-left bg-stone-50 p-4 rounded-xl mb-8 border border-stone-100">
            <h3 className="font-medium text-stone-800 mb-2 text-sm uppercase tracking-wider">How to use:</h3>
            <ol className="list-decimal list-inside text-sm text-stone-600 space-y-2">
              <li>Sign in with your Google account.</li>
              <li>Click "New Practice" to start.</li>
              <li>Input your Chinese thoughts or instructions.</li>
              <li>Get a high-scoring English response with native audio and keywords.</li>
              <li>Review and edit your practices anytime.</li>
            </ol>
            <p className="mt-4 text-xs text-stone-500 italic">
              Works seamlessly on both desktop and mobile browsers.
            </p>
          </div>
          <button
            onClick={signIn}
            className="w-full bg-[#5A5A40] text-white py-4 rounded-full font-medium hover:bg-[#4a4a34] transition-colors shadow-sm text-lg"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] font-sans">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setView('dashboard')}
          >
            <div className="w-8 h-8 bg-[#5A5A40] rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white font-serif font-bold text-sm">I</span>
            </div>
            <span className="font-serif font-semibold text-stone-800 text-lg tracking-wide">IELTS Speaking</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-stone-600 bg-stone-50 px-3 py-1.5 rounded-full border border-stone-100">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon size={16} />
              )}
              <span className="hidden sm:inline">{user.displayName || user.email}</span>
            </div>
            <button
              onClick={logOut}
              className="text-stone-400 hover:text-stone-800 transition-colors p-2"
              title="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="py-8">
        {view === 'dashboard' && (
          <Dashboard
            onNewPractice={() => setView('new')}
            onViewPractice={(practice) => {
              setSelectedPractice(practice);
              setView('detail');
            }}
          />
        )}
        
        {view === 'new' && (
          <NewPractice
            onBack={() => setView('dashboard')}
            onSuccess={(id) => {
              // We could fetch the new practice and show it, but for simplicity, go back to dashboard
              setView('dashboard');
            }}
          />
        )}

        {view === 'detail' && selectedPractice && (
          <PracticeDetail
            practice={selectedPractice}
            onBack={() => setView('dashboard')}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ErrorBoundary>
  );
}
