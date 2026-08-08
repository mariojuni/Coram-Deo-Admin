import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, BookOpen, Globe, Clock, CheckCircle, Archive, AlertCircle, Search } from 'lucide-react';

export default function BibleLibraryDashboard() {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState([]);
  const [versions, setVersions] = useState([]);
  const [imports, setImports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Bible Languages
    const qLang = query(collection(db, 'bibleLanguages'), orderBy('name'));
    const unsubLang = onSnapshot(qLang, (snap) => {
      setLanguages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Listen to Bible Versions
    const qVersions = query(collection(db, 'bibleVersions'));
    const unsubVersions = onSnapshot(qVersions, (snap) => {
      setVersions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Listen to Bible Imports
    const qImports = query(collection(db, 'bibleImports'), orderBy('startedAt', 'desc'));
    const unsubImports = onSnapshot(qImports, (snap) => {
      setImports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubLang();
      unsubVersions();
      unsubImports();
    };
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
                    <div key={version.id} className="bg-white p-3 rounded border border-gray-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-church-navy">
                      <div>
                        <div className="flex justify-between">
                          <span className="font-bold text-church-navy text-sm">{version.abbreviation}</span>
                          <StatusBadge status={version.status} />
                        </div>
                        <p className="text-xs text-gray-900 mt-1 line-clamp-2" title={version.title}>{version.title}</p>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wide">{version.publisher?.name || 'Public Domain'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
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
