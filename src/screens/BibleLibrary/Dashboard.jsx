import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { Plus, BookOpen, Globe, Clock, CheckCircle, Archive, AlertCircle, Search, X, BookMarked, Hash, FileText, Shield, Calendar, RefreshCw, Layers, ChevronRight, Trash2 } from 'lucide-react';

export default function BibleLibraryDashboard() {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState([]);
  const [versions, setVersions] = useState([]);
  const [imports, setImports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(null);

  useEffect(() => {
    const qLang = query(collection(db, 'bibleLanguages'), orderBy('name'));
    const unsubLang = onSnapshot(qLang, (snap) => {
      setLanguages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qVersions = query(collection(db, 'bibleVersions'));
    const unsubVersions = onSnapshot(qVersions, (snap) => {
      setVersions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qImports = query(collection(db, 'bibleImports'), orderBy('startedAt', 'desc'));
    const unsubImports = onSnapshot(qImports, (snap) => {
      setImports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => { unsubLang(); unsubVersions(); unsubImports(); };
  }, []);

  const stats = {
    published: versions.filter(v => v.status === 'published').length,
    languages: languages.length,
    processing: imports.filter(i => ['uploaded', 'processing', 'validating'].includes(i.status)).length,
    validated: versions.filter(v => v.status === 'validated').length,
    archived: versions.filter(v => v.status === 'archived').length,
    failed: imports.filter(i => i.status === 'failed').length,
  };

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.localName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleArchive = async (version) => {
    if (!window.confirm(`Archive "${version.title}"? It will no longer be available in the mobile app.`)) return;
    await updateDoc(doc(db, 'bibleVersions', String(version.id)), { status: 'archived' });
    setSelectedVersion(v => v ? { ...v, status: 'archived' } : null);
  };

  const handlePublish = async (version) => {
    await updateDoc(doc(db, 'bibleVersions', String(version.id)), { status: 'published' });
    setSelectedVersion(v => v ? { ...v, status: 'published' } : null);
  };

  const handleDelete = async (version) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${version.title}"? This cannot be undone.`)) return;

    try {
      const related = imports.filter(i => String(i.translationId) === String(version.translationId));
      
      await Promise.all(related.map(async (imp) => {
        if (imp.sourceStoragePath) {
          const fileRef = ref(storage, imp.sourceStoragePath);
          await deleteObject(fileRef).catch(e => console.log('Error deleting storage file:', e));
        }
        await deleteDoc(doc(db, 'bibleImports', imp.id));
      }));

      await deleteDoc(doc(db, 'bibleVersions', String(version.id)));
      setSelectedVersion(null);
    } catch (error) {
      console.error("Error during deletion:", error);
      alert("An error occurred while deleting the Bible version and its files.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Global Bible Library</h1>
          <p className="text-gray-500 text-sm mt-1">Manage global Bible versions and translations</p>
        </div>
        <button
          onClick={() => navigate('/admin/bible-library/import')}
          className="flex items-center px-4 py-2 bg-church-navy text-white rounded-lg hover:bg-church-navy/90 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          Import Bible Version
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard title="Published" value={stats.published} icon={BookOpen} color="text-green-600" bg="bg-green-100" />
        <StatCard title="Languages" value={stats.languages} icon={Globe} color="text-blue-600" bg="bg-blue-100" />
        <StatCard title="Processing" value={stats.processing} icon={Clock} color="text-yellow-600" bg="bg-yellow-100" />
        <StatCard title="Validated" value={stats.validated} icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-100" />
        <StatCard title="Archived" value={stats.archived} icon={Archive} color="text-gray-600" bg="bg-gray-100" />
        <StatCard title="Failed Imports" value={stats.failed} icon={AlertCircle} color="text-red-600" bg="bg-red-100" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Languages & Versions</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search languages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-church-navy focus:border-transparent"
            />
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : filteredLanguages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No languages found.</div>
          ) : (
            filteredLanguages.map(lang => (
              <div key={lang.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-md font-bold text-gray-900">{lang.name}</h3>
                    {lang.localName && lang.localName !== lang.name && (
                      <p className="text-sm text-gray-500">{lang.localName}</p>
                    )}
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {lang.publishedVersionCount || 0} Versions
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {versions.filter(v => v.languageTag === lang.id).map(version => (
                    <button
                      key={version.id}
                      onClick={() => setSelectedVersion(version)}
                      className="bg-white p-3 rounded border border-gray-200 shadow-sm flex items-start justify-between cursor-pointer hover:border-church-navy hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-church-navy text-sm">{version.abbreviation}</span>
                          <StatusBadge status={version.status} />
                          {version.contentVersion > 1 && (
                            <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">v{version.contentVersion}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-900 line-clamp-2" title={version.title}>{version.title}</p>
                        <p className="text-[10px] text-gray-500 mt-1.5 uppercase tracking-wide">{version.publisher?.name || 'Public Domain'}</p>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-church-navy mt-0.5 ml-2 shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Version Detail Slide-over */}
      {selectedVersion && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedVersion(null)}
          />

          {/* Panel */}
          <div className="relative ml-auto w-full max-w-lg bg-white shadow-2xl flex flex-col h-full animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-church-navy flex items-center justify-center shrink-0">
                  <span className="text-white font-black text-base leading-tight text-center">
                    {selectedVersion.abbreviation}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">{selectedVersion.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={selectedVersion.status} />
                    <span className="text-xs text-gray-400">ID: {selectedVersion.translationId}</span>
                    {selectedVersion.contentVersion > 1 && (
                      <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">v{selectedVersion.contentVersion}</span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedVersion(null)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* Content Stats */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Content Statistics</p>
                <div className="grid grid-cols-3 gap-3">
                  <DetailStat icon={BookMarked} label="Books" value={selectedVersion.bookCount ?? '—'} />
                  <DetailStat icon={Layers} label="Chapters" value={selectedVersion.chapterCount?.toLocaleString() ?? '—'} />
                  <DetailStat icon={FileText} label="Verses" value={selectedVersion.verseCount?.toLocaleString() ?? '—'} />
                </div>
              </div>

              {/* Metadata */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Metadata</p>
                <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                  <MetaRow icon={Globe} label="Language" value={selectedVersion.languageTag} />
                  <MetaRow icon={Shield} label="Publisher" value={selectedVersion.publisher?.name || 'Public Domain'} />
                  <MetaRow icon={Hash} label="Translation ID" value={String(selectedVersion.translationId)} />
                  <MetaRow icon={RefreshCw} label="Content Version" value={`v${selectedVersion.contentVersion ?? 1}`} />
                  <MetaRow icon={Calendar} label="Schema Version" value={`v${selectedVersion.schemaVersion ?? 1}`} />
                </div>
              </div>

              {/* Copyright */}
              {selectedVersion.copyright?.shortText && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Copyright</p>
                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3">
                    {selectedVersion.copyright.shortText}
                  </p>
                </div>
              )}

              {/* Content Hash */}
              {selectedVersion.contentHash && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Content Hash</p>
                  <p className="text-[10px] font-mono text-gray-400 bg-gray-50 rounded-xl p-3 break-all">
                    {selectedVersion.contentHash}
                  </p>
                </div>
              )}

              {/* Related Imports */}
              {(() => {
                const related = imports.filter(i => String(i.translationId) === String(selectedVersion.translationId));
                if (!related.length) return null;
                return (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Import History</p>
                    <div className="space-y-2">
                      {related.map(imp => (
                        <div key={imp.id} className="bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-gray-700">Import {imp.id.slice(0, 8)}…</p>
                            <p className="text-[10px] text-gray-400">
                              {imp.versesProcessed?.toLocaleString()} verses · {imp.chaptersProcessed?.toLocaleString()} chapters
                            </p>
                          </div>
                          <StatusBadge status={imp.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-100 flex gap-3">
              {selectedVersion.status !== 'archived' ? (
                <button
                  onClick={() => handleArchive(selectedVersion)}
                  className="flex-1 flex items-center justify-center px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  <Archive size={15} className="mr-2" />
                  Archive
                </button>
              ) : (
                <button
                  onClick={() => handlePublish(selectedVersion)}
                  className="flex-1 flex items-center justify-center px-4 py-2.5 border border-green-300 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors"
                >
                  <CheckCircle size={15} className="mr-2" />
                  Re-publish
                </button>
              )}
              <button
                onClick={() => { setSelectedVersion(null); navigate('/admin/bible-library/import'); }}
                className="flex-1 flex items-center justify-center px-4 py-2.5 bg-church-navy text-white rounded-lg text-sm font-semibold hover:bg-church-navy/90 transition-colors"
              >
                <RefreshCw size={15} className="mr-2" />
                Re-import
              </button>
              <button
                onClick={() => handleDelete(selectedVersion)}
                className="flex items-center justify-center px-4 py-2.5 border border-red-300 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors"
                title="Delete Version"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center">
      <div className={`p-3 rounded-lg ${bg} mr-4`}>
        <Icon size={20} className={color} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{title}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    published: 'bg-green-100 text-green-800',
    validated: 'bg-emerald-100 text-emerald-800',
    processing: 'bg-yellow-100 text-yellow-800',
    archived: 'bg-gray-100 text-gray-800',
    failed: 'bg-red-100 text-red-800'
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors[status] || colors.processing}`}>
      {status}
    </span>
  );
}

function DetailStat({ icon: Icon, label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <Icon size={16} className="mx-auto text-church-navy mb-1" />
      <p className="text-base font-black text-gray-900">{value}</p>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center px-3 py-2.5 gap-3">
      <Icon size={14} className="text-gray-400 shrink-0" />
      <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
      <span className="text-xs font-semibold text-gray-800 truncate">{value}</span>
    </div>
  );
}
