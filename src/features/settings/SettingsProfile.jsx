import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
import { hasRole } from '../../utils/permissions';
import { 
  Save, 
  Upload, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Plus, 
  Trash2, 
  Globe, 
  Church, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Share2,
  Coins,
  Building2,
  User,
  Video,
  Compass,
  X
} from 'lucide-react';
import ModernDropdown from '../../components/ui/ModernDropdown';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';
import SettingsHeader from './SettingsHeader';
import SettingsUsersAndRoles from './SettingsUsersAndRoles';
import SettingsSubscription from './SettingsSubscription';
import { 
  POPULAR_CURRENCIES, 
  DEFAULT_CURRENCY_CONFIG, 
  findCurrencyByCode, 
  normalizeCurrencyConfig 
} from '../../config/currencies';
import { formatCurrency } from '../../utils/currency';

const DAYS_OF_WEEK = [
  { value: 'Sunday', label: 'Sunday' },
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Saturday', label: 'Saturday' },
];

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Manila', label: 'Asia/Manila (GMT+8)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong Kong (GMT+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
  { value: 'Asia/Seoul', label: 'Asia/Seoul (GMT+9)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GMT+4)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (GMT+10/11)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
];

export default function SettingsProfile() {
  const { userProfile, activeChurchId, setActiveChurchId } = useAuth();
  const isSuperAdmin = hasRole(userProfile, 'super_admin');
  const [churchesList, setChurchesList] = useState([]);
  const [selectedChurchId, setSelectedChurchId] = useState(
    activeChurchId && activeChurchId !== 'system' ? activeChurchId : (userProfile?.churchId || '')
  );

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isRolesUrl = location.pathname.includes('/roles') || searchParams.get('tab') === 'roles';
  const isBillingUrl = location.pathname.includes('/billing') || location.pathname.includes('/subscription') || searchParams.get('tab') === 'billing';
  const initialTab = isRolesUrl ? 'roles' : isBillingUrl ? 'billing' : 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [usersCount, setUsersCount] = useState(null);

  // Fetch church list for superadmin tenants
  useEffect(() => {
    if (isSuperAdmin) {
      async function fetchChurches() {
        try {
          const snap = await getDocs(query(collection(db, 'churches'), orderBy('name', 'asc')));
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setChurchesList(list);
          if (!selectedChurchId && list.length > 0) {
            setSelectedChurchId(list[0].id);
          }
        } catch (e) {
          console.error("Error fetching churches in settings:", e);
        }
      }
      fetchChurches();
    }
  }, [isSuperAdmin]);

  // Keep selectedChurchId in sync when activeChurchId changes to a valid church
  useEffect(() => {
    if (activeChurchId && activeChurchId !== 'system') {
      setSelectedChurchId(activeChurchId);
    }
  }, [activeChurchId]);

  const targetChurchId = (activeChurchId && activeChurchId !== 'system')
    ? activeChurchId
    : (selectedChurchId || userProfile?.churchId || (churchesList[0]?.id || null));

  useEffect(() => {
    if (location.pathname.includes('/roles') || searchParams.get('tab') === 'roles') {
      setActiveTab('roles');
    } else if (location.pathname.includes('/billing') || location.pathname.includes('/subscription') || searchParams.get('tab') === 'billing') {
      setActiveTab('billing');
    } else {
      setActiveTab('profile');
    }
  }, [location.pathname, searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'roles') {
      navigate('/admin/settings/roles', { replace: true });
    } else if (tab === 'billing') {
      navigate('/admin/settings/billing', { replace: true });
    } else {
      navigate('/admin/settings', { replace: true });
    }
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    churchName: '',
    shortName: '',
    denomination: '',
    seniorPastor: '',
    district: '',
    dateOrganized: '',
    tagline: '',
    logoUrl: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    currency: { ...DEFAULT_CURRENCY_CONFIG },
    timezone: 'Asia/Manila',
    contact: {
      phone: '',
      pastoralPhone: '',
      email: '',
    },
    social: {
      website: '',
      facebook: '',
      youtube: '',
      instagram: '',
    },
    serviceSchedules: [],
  });

  useEffect(() => {
    if (!targetChurchId || targetChurchId === 'system') {
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadSettings() {
      setLoading(true);
      try {
        // 1. Primary source of truth: top-level church document
        const churchSnap = await getDoc(doc(db, 'churches', targetChurchId));
        let churchBaseData = churchSnap.exists() ? (churchSnap.data() || {}) : {};

        // 2. Secondary source: subcollection /settings/profile (if it exists)
        let subData = {};
        try {
          const subDocRef = doc(db, 'churches', targetChurchId, 'settings', 'profile');
          const subSnap = await getDoc(subDocRef);
          if (subSnap.exists()) {
            subData = subSnap.data() || {};
          }
        } catch (subErr) {
          // Subcollection read permission error is non-blocking
        }

        if (!isMounted) return;

        const data = { ...subData, ...churchBaseData };
        const loadedCurrency = normalizeCurrencyConfig(data.currency || churchBaseData.currency);

        setFormData({
          churchName: data.churchName || churchBaseData.name || '',
          shortName: data.shortName || churchBaseData.shortName || '',
          denomination: data.denomination || churchBaseData.denomination || '',
          seniorPastor: data.seniorPastor || churchBaseData.seniorPastor || '',
          district: data.district || churchBaseData.district || '',
          dateOrganized: data.dateOrganized || churchBaseData.dateOrganized || '',
          tagline: data.tagline || churchBaseData.tagline || '',
          logoUrl: data.logoUrl || churchBaseData.logoUrl || '',
          address: data.address || churchBaseData.address || '',
          city: data.city || churchBaseData.city || '',
          province: data.province || churchBaseData.province || '',
          postalCode: data.postalCode || churchBaseData.postalCode || '',
          country: data.country || churchBaseData.country || 'Philippines',
          currency: loadedCurrency,
          timezone: data.timezone || churchBaseData.timezone || 'Asia/Manila',
          contact: {
            phone: data.contact?.phone || churchBaseData.contact?.phone || '',
            pastoralPhone: data.contact?.pastoralPhone || churchBaseData.contact?.pastoralPhone || '',
            email: data.contact?.email || churchBaseData.contact?.email || '',
          },
          social: {
            website: data.social?.website || '',
            facebook: data.social?.facebook || '',
            youtube: data.social?.youtube || '',
            instagram: data.social?.instagram || '',
          },
          serviceSchedules: Array.isArray(data.serviceSchedules) && data.serviceSchedules.length > 0
            ? data.serviceSchedules
            : (Array.isArray(churchBaseData.serviceSchedules) && churchBaseData.serviceSchedules.length > 0
                ? churchBaseData.serviceSchedules
                : [
                    { day: 'Sunday', time: '09:00 AM', name: 'Sunday Morning Worship', venue: 'Main Sanctuary' },
                    { day: 'Wednesday', time: '07:00 PM', name: 'Midweek Prayer & Study', venue: 'Fellowship Hall' }
                  ]),
        });
      } catch (err) {
        console.error('Error loading church settings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSettings();
    return () => { isMounted = false; };
  }, [targetChurchId]);

  const handleCurrencyPresetChange = (currencyCode) => {
    const preset = findCurrencyByCode(currencyCode);
    if (preset) {
      setFormData((prev) => ({
        ...prev,
        currency: {
          code: preset.code,
          symbol: preset.symbol,
          name: preset.name,
          position: preset.position,
          decimalPlaces: preset.decimalPlaces,
          locale: preset.locale,
        },
      }));
    }
  };

  const handleCurrencyFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      currency: {
        ...prev.currency,
        [field]: value,
      },
    }));
  };

  const handleChange = (e, section = null) => {
    const { name, value } = e.target;
    if (section) {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreviewUrl('');
    setFormData((prev) => ({ ...prev, logoUrl: '' }));
  };

  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      serviceSchedules: [
        ...prev.serviceSchedules,
        { day: 'Sunday', time: '10:30 AM', name: 'Worship Service', venue: 'Main Sanctuary' },
      ],
    }));
  };

  const updateService = (index, field, value) => {
    const updated = [...formData.serviceSchedules];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, serviceSchedules: updated }));
  };

  const removeService = (index) => {
    const updated = formData.serviceSchedules.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, serviceSchedules: updated }));
  };

  const handleSave = async () => {
    if (!targetChurchId || targetChurchId === 'system') {
      setMessage({ text: 'Please select a specific church tenant before saving settings.', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      let finalLogoUrl = formData.logoUrl || '';

      if (logoFile) {
        try {
          const storageRef = ref(storage, `churches/${targetChurchId}/logo_${Date.now()}_${logoFile.name}`);
          const uploadTask = uploadBytesResumable(storageRef, logoFile);

          await new Promise((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(Math.round(progress));
              },
              (err) => reject(err),
              async () => {
                try {
                  finalLogoUrl = await getDownloadURL(uploadTask.snapshot.ref);
                  resolve();
                } catch (urlErr) {
                  reject(urlErr);
                }
              }
            );
          });
        } catch (uploadError) {
          console.error('Logo upload error:', uploadError);
        }
      }

      const normalizedCurrency = normalizeCurrencyConfig(formData.currency);

      const cleanContact = {
        phone: formData.contact?.phone || '',
        pastoralPhone: formData.contact?.pastoralPhone || '',
        email: formData.contact?.email || '',
      };

      const cleanSocial = {
        website: formData.social?.website || '',
        facebook: formData.social?.facebook || '',
        youtube: formData.social?.youtube || '',
        instagram: formData.social?.instagram || '',
      };

      const cleanSchedules = (formData.serviceSchedules || []).map((s) => ({
        day: s.day || 'Sunday',
        time: s.time || '',
        name: s.name || '',
        venue: s.venue || '',
      }));

      // Primary Church Document Payload
      // This is the core document used across the entire platform and mobile app
      const churchPayload = {
        name: formData.churchName || '',
        churchName: formData.churchName || '',
        shortName: formData.shortName || '',
        denomination: formData.denomination || '',
        seniorPastor: formData.seniorPastor || '',
        district: formData.district || '',
        dateOrganized: formData.dateOrganized || '',
        tagline: formData.tagline || '',
        address: formData.address || '',
        city: formData.city || '',
        province: formData.province || '',
        postalCode: formData.postalCode || '',
        country: formData.country || 'Philippines',
        contact: cleanContact,
        social: cleanSocial,
        currency: normalizedCurrency,
        currencyCode: normalizedCurrency.code,
        currencySymbol: normalizedCurrency.symbol,
        timezone: formData.timezone || 'Asia/Manila',
        serviceSchedules: cleanSchedules,
        logoUrl: finalLogoUrl,
        updatedAt: serverTimestamp(),
      };

      // 1. PRIMARY SAVE: Directly to churches/{targetChurchId} with setDoc merge
      const churchDocRef = doc(db, 'churches', targetChurchId);
      await setDoc(churchDocRef, churchPayload, { merge: true });

      // 2. SECONDARY SAVE: subcollection churches/{targetChurchId}/settings/profile
      // Non-blocking in case subcollection rules are not deployed
      try {
        const settingsDocRef = doc(db, 'churches', targetChurchId, 'settings', 'profile');
        await setDoc(settingsDocRef, {
          ...churchPayload,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (subErr) {
        console.warn('Dual-sync to settings subcollection skipped:', subErr);
      }

      if (finalLogoUrl !== formData.logoUrl) {
        setFormData((prev) => ({ ...prev, logoUrl: finalLogoUrl }));
        setLogoFile(null);
      }

      setMessage({ text: 'Church profile updated successfully!', type: 'success' });
    } catch (err) {
      console.error('Settings save failure:', err);
      const errText = err?.message
        ? `Failed to save changes: ${err.message}`
        : 'Failed to save changes. Please try again.';
      setMessage({ text: errText, type: 'error' });
    } finally {
      setSaving(false);
      setUploadProgress(0);
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-10 h-10 border-3 border-church-rose/20 border-t-church-rose rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-church-slate">Loading church profile...</p>
      </div>
    );
  }

  const activeDisplayLogo = logoPreviewUrl || formData.logoUrl;

  return (
    <div className="space-y-6">
      {/* Header Bar with integrated bottom tabs (Non-floating) */}
      <SettingsHeader
        activeTab={activeTab}
        onTabChange={handleTabChange}
        eyebrow={activeTab === 'roles' ? 'Users & Access Control' : activeTab === 'billing' ? 'Subscription & Billing' : 'Church Profile'}
        title={activeTab === 'roles' ? 'Users & Access Control' : activeTab === 'billing' ? 'Subscription & Billing' : 'Church Profile'}
        subtitle={
          activeTab === 'roles'
            ? 'Manage system access levels, permissions, and staff roles for your team.'
            : activeTab === 'billing'
            ? 'Manage church plan tier, automated monthly renewals, card methods, and official board receipts.'
            : 'Manage congregation details, campus location, worship service schedules, and financial localization.'
        }
        usersCount={usersCount}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {isSuperAdmin && churchesList.length > 0 && (
              <div className="w-48 sm:w-56">
                <ModernDropdown
                  value={targetChurchId || ''}
                  placeholder="Select Church..."
                  options={churchesList.map((c) => ({
                    value: c.id,
                    label: c.name || c.churchName || c.id,
                  }))}
                  onChange={(newId) => {
                    setSelectedChurchId(newId);
                    setActiveChurchId(newId);
                  }}
                />
              </div>
            )}

            {activeTab === 'profile' && (
              <>
                {message.text && (
                  <StatusPill
                    variant={message.type === 'success' ? 'emerald' : 'rose'}
                    dot
                    icon={message.type === 'success' ? CheckCircle2 : AlertCircle}
                  >
                    {message.text}
                  </StatusPill>
                )}

                <GradientButton
                  onClick={handleSave}
                  loading={saving}
                  disabled={saving || !targetChurchId || targetChurchId === 'system'}
                  icon={Save}
                  size="md"
                >
                  Save Changes
                </GradientButton>
              </>
            )}
          </div>
        }
      />

      {/* Tab 1: Church Profile */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Emblem & Localization */}
        <div className="lg:col-span-5 space-y-6">
          {/* Church Emblem & Seal */}
          <SoftCard className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-church-rose/10 flex items-center justify-center text-church-rose">
                <Church size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-church-navy leading-tight">Church Emblem & Seal</h2>
                <p className="text-[11px] text-church-slate font-medium">Congregation crest, logo, or official seal</p>
              </div>
            </div>

            <div>
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-church-canvas relative group transition-all hover:border-church-rose/40 hover:bg-church-rose/5">
                {activeDisplayLogo ? (
                  <div className="relative group/logo">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden bg-white shadow-church-soft border border-gray-100 flex items-center justify-center p-2.5">
                      <img
                        src={activeDisplayLogo}
                        alt="Church Emblem"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                      title="Remove emblem"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                    <Church size={38} className="mb-1 text-gray-300" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase">No Emblem</span>
                  </div>
                )}

                <label className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-xs font-bold text-church-navy rounded-full shadow-sm hover:border-church-rose hover:text-church-rose cursor-pointer transition-colors">
                  <Upload size={14} />
                  <span>{activeDisplayLogo ? 'Change Emblem' : 'Upload Emblem'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>

                <p className="text-[11px] text-gray-400 text-center mt-2 leading-relaxed">
                  Recommended: Square PNG, JPG, or SVG (400×400px)
                </p>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] font-bold text-church-slate mb-1">
                    <span>Uploading Emblem...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-coram h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </SoftCard>

          {/* Currency & Financial Localization */}
          <SoftCard className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Coins size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-church-navy leading-tight">Currency & Localization</h2>
                <p className="text-[11px] text-church-slate font-medium">Financial denomination and congregation timezone</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Currency Preset Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                  Currency Preset
                </label>
                <ModernDropdown
                  value={formData.currency.code}
                  onChange={handleCurrencyPresetChange}
                  options={POPULAR_CURRENCIES.map((c) => ({
                    value: c.code,
                    label: c.label,
                  }))}
                  searchable
                />
              </div>

              {/* Currency Symbol & Placement */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                    Symbol / Sign
                  </label>
                  <input
                    type="text"
                    value={formData.currency.symbol}
                    onChange={(e) => handleCurrencyFieldChange('symbol', e.target.value)}
                    placeholder="e.g. ₱, $, AED"
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-bold text-church-navy focus:bg-white focus:border-church-rose focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                    Placement
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-gray-50/70 p-1 rounded-xl border border-gray-200">
                    <button
                      type="button"
                      onClick={() => handleCurrencyFieldChange('position', 'prefix')}
                      className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                        formData.currency.position === 'prefix'
                          ? 'bg-white text-church-navy shadow-xs'
                          : 'text-church-slate hover:text-church-navy'
                      }`}
                    >
                      Prefix
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCurrencyFieldChange('position', 'suffix')}
                      className={`py-1.5 text-[11px] font-bold rounded-lg transition-all ${
                        formData.currency.position === 'suffix'
                          ? 'bg-white text-church-navy shadow-xs'
                          : 'text-church-slate hover:text-church-navy'
                      }`}
                    >
                      Suffix
                    </button>
                  </div>
                </div>
              </div>

              {/* Decimal Precision */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                  Decimal Places
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[2, 0].map((decimals) => (
                    <button
                      key={decimals}
                      type="button"
                      onClick={() => handleCurrencyFieldChange('decimalPlaces', decimals)}
                      className={`px-3 py-2.5 border rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        formData.currency.decimalPlaces === decimals
                          ? 'border-church-rose bg-church-rose/5 text-church-rose'
                          : 'border-gray-200 bg-gray-50/70 text-church-slate hover:bg-white'
                      }`}
                    >
                      <span>{decimals === 2 ? '2 Decimals (.00)' : 'Integer (No Decimals)'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Congregation Timezone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                  Congregation Timezone
                </label>
                <ModernDropdown
                  value={formData.timezone}
                  onChange={(val) => setFormData((prev) => ({ ...prev, timezone: val }))}
                  options={TIMEZONE_OPTIONS}
                  searchable
                />
              </div>

              {/* Live Preview Card */}
              <div className="p-4 bg-gradient-to-br from-church-rose-light/50 to-white rounded-2xl border border-church-rose/20 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-church-rose block mb-1">
                  Live Display Preview
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-church-slate font-medium">Sample Tithe / Offering:</span>
                  <span className="text-lg font-black text-church-navy">
                    {formatCurrency(1250, formData.currency)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1.5 pt-1.5 border-t border-gray-100">
                  <span className="text-[11px] text-church-slate">Report KPI Summary:</span>
                  <span className="text-xs font-bold text-emerald-600">
                    +{formatCurrency(45000, formData.currency, { compact: true })}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed">
                Applies globally across donation records, ministry expense tracking, financial statements, and member mobile giving forms.
              </p>
            </div>
          </SoftCard>
        </div>

        {/* Right Column (7 Cols): General Info, Location & Contacts */}
        <div className="lg:col-span-7 space-y-6">
          {/* General Church Information */}
          <SoftCard className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-church-rose/10 flex items-center justify-center text-church-rose">
                <Building2 size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-church-navy leading-tight">Congregation Information</h2>
                <p className="text-[11px] text-church-slate font-medium">Official name, leadership, affiliation, and establishment</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Church Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                    Church Official Name *
                  </label>
                  <input
                    type="text"
                    name="churchName"
                    value={formData.churchName}
                    onChange={handleChange}
                    placeholder="e.g. Grace Fellowship Baptist Church"
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-semibold text-church-navy focus:bg-white focus:border-church-rose focus:ring-2 focus:ring-church-rose/20 focus:outline-none transition-all"
                  />
                </div>

                {/* Short Name / Acronym */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                    Short Name / Acronym
                  </label>
                  <input
                    type="text"
                    name="shortName"
                    value={formData.shortName}
                    onChange={handleChange}
                    placeholder="e.g. GFBC"
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-semibold text-church-navy focus:bg-white focus:border-church-rose focus:ring-2 focus:ring-church-rose/20 focus:outline-none transition-all uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Senior / Lead Pastor */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                    Senior / Lead Pastor
                  </label>
                  <input
                    type="text"
                    name="seniorPastor"
                    value={formData.seniorPastor}
                    onChange={handleChange}
                    placeholder="e.g. Pastor David Reynolds"
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-medium text-church-navy focus:bg-white focus:border-church-rose focus:ring-2 focus:ring-church-rose/20 focus:outline-none transition-all"
                  />
                </div>

                {/* Denomination / Network */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                    Denomination / Affiliation
                  </label>
                  <input
                    type="text"
                    name="denomination"
                    value={formData.denomination}
                    onChange={handleChange}
                    placeholder="e.g. Reformed Baptist, Non-Denominational, PCA"
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-medium text-church-navy focus:bg-white focus:border-church-rose focus:ring-2 focus:ring-church-rose/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* District / Jurisdiction */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                    District / Jurisdiction / Presbytery
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="e.g. Metro Manila District"
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-medium text-church-navy focus:bg-white focus:border-church-rose focus:ring-2 focus:ring-church-rose/20 focus:outline-none transition-all"
                  />
                </div>

                {/* Date Organized / Established */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                    Date Established / Organized
                  </label>
                  <input
                    type="text"
                    name="dateOrganized"
                    value={formData.dateOrganized}
                    onChange={handleChange}
                    placeholder="e.g. October 1998"
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-medium text-church-navy focus:bg-white focus:border-church-rose focus:ring-2 focus:ring-church-rose/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Tagline / Motto */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                  Church Motto / Mission Statement
                </label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="e.g. Soli Deo Gloria — Knowing Christ and Making Him Known"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-medium text-church-navy focus:bg-white focus:border-church-rose focus:ring-2 focus:ring-church-rose/20 focus:outline-none transition-all"
                />
              </div>
            </div>
          </SoftCard>

          {/* Campus Location & Address */}
          <SoftCard className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MapPin size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-church-navy leading-tight">Campus & Sanctuary Location</h2>
                <p className="text-[11px] text-church-slate font-medium">Meeting facility address and municipal location</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Street Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                  Sanctuary / Building Address
                </label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Building, Suite, Street name, Barangay / Neighborhood"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-medium text-church-navy focus:bg-white focus:border-church-rose focus:ring-2 focus:ring-church-rose/20 focus:outline-none resize-none transition-all"
                />
              </div>

              {/* City, Province, Postal Code, Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-church-slate mb-1">
                    City / Town
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Quezon City"
                    className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-church-navy focus:bg-white focus:border-church-rose focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-church-slate mb-1">
                    Province / State
                  </label>
                  <input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    placeholder="e.g. Metro Manila"
                    className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-church-navy focus:bg-white focus:border-church-rose focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-church-slate mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="e.g. 1100"
                    className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-church-navy focus:bg-white focus:border-church-rose focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-church-slate mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="e.g. Philippines"
                    className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-church-navy focus:bg-white focus:border-church-rose focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </SoftCard>

          {/* Contact & Church Media Channels */}
          <SoftCard className="p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Phone size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-church-navy leading-tight">Contact & Communications</h2>
                <p className="text-[11px] text-church-slate font-medium">Office numbers, pastoral hotline, and congregation media</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Phone, Pastoral Care & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                    Church Office Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.contact.phone}
                    onChange={(e) => handleChange(e, 'contact')}
                    placeholder="+63 (02) 8123-4567"
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:bg-white focus:border-church-rose focus:ring-2 focus:ring-church-rose/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                    Pastoral Care Hotline
                  </label>
                  <input
                    type="text"
                    name="pastoralPhone"
                    value={formData.contact.pastoralPhone}
                    onChange={(e) => handleChange(e, 'contact')}
                    placeholder="+63 917 123 4567"
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:bg-white focus:border-church-rose focus:ring-2 focus:ring-church-rose/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                    General Office Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.contact.email}
                    onChange={(e) => handleChange(e, 'contact')}
                    placeholder="office@church.org"
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:bg-white focus:border-church-rose focus:ring-2 focus:ring-church-rose/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Online Media & Broadcast Channels */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-church-slate">
                    Broadcast & Digital Channels
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-church-slate mb-1">
                      Church Website
                    </label>
                    <input
                      type="text"
                      name="website"
                      value={formData.social.website}
                      onChange={(e) => handleChange(e, 'social')}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:bg-white focus:border-church-rose focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-church-slate mb-1">
                      YouTube / Livestream
                    </label>
                    <input
                      type="text"
                      name="youtube"
                      value={formData.social.youtube}
                      onChange={(e) => handleChange(e, 'social')}
                      placeholder="@churchstream"
                      className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:bg-white focus:border-church-rose focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-church-slate mb-1">
                      Facebook Page
                    </label>
                    <input
                      type="text"
                      name="facebook"
                      value={formData.social.facebook}
                      onChange={(e) => handleChange(e, 'social')}
                      placeholder="facebook.com/church"
                      className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:bg-white focus:border-church-rose focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-church-slate mb-1">
                      Instagram Handle
                    </label>
                    <input
                      type="text"
                      name="instagram"
                      value={formData.social.instagram}
                      onChange={(e) => handleChange(e, 'social')}
                      placeholder="@churchcommunity"
                      className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:bg-white focus:border-church-rose focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </SoftCard>
        </div>

        {/* Full-Width Section (12 Cols): Worship Service Schedules */}
        <div className="lg:col-span-12">
          <SoftCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-church-navy leading-tight">Regular Worship Services & Gatherings</h2>
                    <StatusPill variant="violet">
                      {formData.serviceSchedules.length} {formData.serviceSchedules.length === 1 ? 'Service' : 'Services'}
                    </StatusPill>
                  </div>
                  <p className="text-[11px] text-church-slate font-medium">Weekly congregation schedule published on the mobile member app</p>
                </div>
              </div>

              <button
                type="button"
                onClick={addService}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-church-cream/70 hover:bg-church-cream text-church-navy text-xs font-bold rounded-full border border-gray-200/80 transition-colors self-start sm:self-auto shadow-xs"
              >
                <Plus size={14} className="text-church-rose" />
                <span>Add Service</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.serviceSchedules.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-bold text-church-navy">No regular schedules added yet</p>
                  <p className="text-xs text-church-slate mt-0.5">Click "Add Service" to configure regular gathering times</p>
                </div>
              ) : (
                formData.serviceSchedules.map((service, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row items-stretch md:items-center gap-3.5 bg-gray-50/80 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-church-slate shrink-0 shadow-2xs">
                      <Clock size={18} />
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Day of Week */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-church-slate mb-1 md:hidden">
                          Day
                        </label>
                        <ModernDropdown
                          value={service.day}
                          onChange={(val) => updateService(index, 'day', val)}
                          options={DAYS_OF_WEEK}
                        />
                      </div>

                      {/* Start Time */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-church-slate mb-1 md:hidden">
                          Time
                        </label>
                        <input
                          type="text"
                          placeholder="Time (e.g. 09:00 AM)"
                          value={service.time}
                          onChange={(e) => updateService(index, 'time', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-church-navy focus:border-church-rose focus:outline-none"
                        />
                      </div>

                      {/* Service Name */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-church-slate mb-1 md:hidden">
                          Service Title
                        </label>
                        <input
                          type="text"
                          placeholder="Service Name (e.g. Sunday Worship Celebration)"
                          value={service.name}
                          onChange={(e) => updateService(index, 'name', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-church-navy focus:border-church-rose focus:outline-none"
                        />
                      </div>

                      {/* Venue / Sanctuary */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-church-slate mb-1 md:hidden">
                          Venue / Room
                        </label>
                        <input
                          type="text"
                          placeholder="Venue (e.g. Main Sanctuary)"
                          value={service.venue || ''}
                          onChange={(e) => updateService(index, 'venue', e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:border-church-rose focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors self-end md:self-auto shrink-0"
                      title="Remove schedule"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </SoftCard>
        </div>
      </div>
      )}

      {/* Tab 2: Users & Access Control — Integrated in one screen */}
      {activeTab === 'roles' && (
        <SettingsUsersAndRoles 
          embedded 
          onUserCountChange={setUsersCount} 
          churchId={targetChurchId} 
        />
      )}

      {/* Tab 3: Subscription & Billing */}
      {activeTab === 'billing' && (
        <SettingsSubscription churchId={targetChurchId} />
      )}
    </div>
  );
}
