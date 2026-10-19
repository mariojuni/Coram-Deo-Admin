import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../firebase';
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
  Palette, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Share2,
  Coins
} from 'lucide-react';
import ModernDropdown from '../../components/ui/ModernDropdown';
import SoftCard from '../../components/ui/SoftCard';
import GradientButton from '../../components/ui/GradientButton';
import StatusPill from '../../components/ui/StatusPill';
import { 
  POPULAR_CURRENCIES, 
  DEFAULT_CURRENCY_CONFIG, 
  findCurrencyByCode, 
  normalizeCurrencyConfig 
} from '../../config/currencies';
import { formatCurrency } from '../../utils/currency';

const THEME_PALETTE = [
  { name: 'Coram Rose', hex: '#FF577F' },
  { name: 'Electric Violet', hex: '#B66DFF' },
  { name: 'Emerald Growth', hex: '#10B981' },
  { name: 'Royal Blue', hex: '#3B82F6' },
  { name: 'Golden Amber', hex: '#F59E0B' },
  { name: 'Deep Navy', hex: '#1E293B' },
];

const DAYS_OF_WEEK = [
  { value: 'Sunday', label: 'Sunday' },
  { value: 'Monday', label: 'Monday' },
  { value: 'Tuesday', label: 'Tuesday' },
  { value: 'Wednesday', label: 'Wednesday' },
  { value: 'Thursday', label: 'Thursday' },
  { value: 'Friday', label: 'Friday' },
  { value: 'Saturday', label: 'Saturday' },
];

export default function SettingsProfile() {
  const { userProfile, activeChurchId } = useAuth();
  const CHURCH_ID = activeChurchId || userProfile?.churchId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    churchName: '',
    district: '',
    dateOrganized: '',
    logoUrl: '',
    theme: {
      primaryColor: '#FF577F',
    },
    currency: { ...DEFAULT_CURRENCY_CONFIG },
    address: '',
    contact: {
      phone: '',
      email: '',
    },
    social: {
      facebook: '',
      instagram: '',
      website: '',
    },
    serviceSchedules: [],
  });

  useEffect(() => {
    if (!CHURCH_ID) {
      setLoading(false);
      return;
    }

    async function loadSettings() {
      try {
        // Fetch from settings subcollection
        const docRef = doc(db, 'churches', CHURCH_ID, 'settings', 'profile');
        const docSnap = await getDoc(docRef);
        
        // Also fetch base church document to fill in any missing details
        let churchBaseData = {};
        try {
          const churchSnap = await getDoc(doc(db, 'churches', CHURCH_ID));
          if (churchSnap.exists()) {
            churchBaseData = churchSnap.data() || {};
          }
        } catch (e) {
          console.warn('Could not read base church doc:', e);
        }

        const loadedCurrency = normalizeCurrencyConfig(data.currency || churchBaseData.currency);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            churchName: data.churchName || churchBaseData.name || '',
            district: data.district || churchBaseData.district || '',
            dateOrganized: data.dateOrganized || churchBaseData.dateOrganized || '',
            logoUrl: data.logoUrl || churchBaseData.logoUrl || '',
            theme: { primaryColor: data.theme?.primaryColor || '#FF577F' },
            currency: normalizeCurrencyConfig(data.currency || churchBaseData.currency),
            address: data.address || churchBaseData.address || '',
            contact: {
              phone: data.contact?.phone || churchBaseData.contact?.phone || '',
              email: data.contact?.email || churchBaseData.contact?.email || '',
            },
            social: {
              facebook: data.social?.facebook || '',
              instagram: data.social?.instagram || '',
              website: data.social?.website || '',
            },
            serviceSchedules: data.serviceSchedules || [
              { day: 'Sunday', time: '09:00 AM', name: 'Morning Worship Celebration' },
              { day: 'Wednesday', time: '07:00 PM', name: 'Midweek Prayer & Study' }
            ],
          });
        } else {
          // Initialize with base church info
          setFormData({
            churchName: churchBaseData.name || '',
            district: churchBaseData.district || '',
            dateOrganized: churchBaseData.dateOrganized || '',
            logoUrl: churchBaseData.logoUrl || '',
            theme: { primaryColor: '#FF577F' },
            currency: loadedCurrency,
            address: churchBaseData.address || '',
            contact: {
              phone: churchBaseData.contact?.phone || '',
              email: churchBaseData.contact?.email || '',
            },
            social: { facebook: '', instagram: '', website: '' },
            serviceSchedules: [
              { day: 'Sunday', time: '09:00 AM', name: 'Morning Worship Celebration' },
              { day: 'Wednesday', time: '07:00 PM', name: 'Midweek Prayer & Study' }
            ],
          });
        }
      } catch (err) {
        console.error('Error loading church settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [CHURCH_ID]);

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

  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      serviceSchedules: [
        ...prev.serviceSchedules,
        { day: 'Sunday', time: '10:30 AM', name: 'Main Worship Service' },
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
    if (!CHURCH_ID) return;
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      let finalLogoUrl = formData.logoUrl;

      // Handle Logo Upload to Storage
      if (logoFile) {
        const storageRef = ref(storage, `brand/${CHURCH_ID}/logo_${Date.now()}_${logoFile.name}`);
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
              finalLogoUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      const normalizedCurrency = normalizeCurrencyConfig(formData.currency);

      const settingsData = {
        ...formData,
        currency: normalizedCurrency,
        logoUrl: finalLogoUrl,
        updatedAt: serverTimestamp(),
      };

      // 1. Save to settings profile subcollection
      const docRef = doc(db, 'churches', CHURCH_ID, 'settings', 'profile');
      await setDoc(docRef, settingsData, { merge: true });

      // 2. Dual-sync key fields back to the primary church record for superadmin and reports
      try {
        const churchDocRef = doc(db, 'churches', CHURCH_ID);
        await updateDoc(churchDocRef, {
          name: formData.churchName,
          district: formData.district || '',
          dateOrganized: formData.dateOrganized || '',
          address: formData.address || '',
          contact: formData.contact || {},
          currency: normalizedCurrency,
          logoUrl: finalLogoUrl,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Could not dual-sync to primary church record:', err);
      }

      if (finalLogoUrl !== formData.logoUrl) {
        setFormData((prev) => ({ ...prev, logoUrl: finalLogoUrl }));
        setLogoFile(null);
      }

      setMessage({ text: 'Church profile updated successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to save changes. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
      setUploadProgress(0);
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
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
    <div className="space-y-6 pb-12">
      {/* Sticky Header Bar */}
      <SoftCard className="p-6 sticky top-6 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-church-rose">
              Configuration
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-[11px] font-medium text-church-slate">Church Identity</span>
          </div>
          <h1 className="text-2xl font-black text-church-navy tracking-tight">Church Profile</h1>
          <p className="text-xs text-church-slate mt-0.5">
            Manage your congregation's identity, branding, contact details, and service times.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
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
            icon={Save}
            size="md"
          >
            Save Changes
          </GradientButton>
        </div>
      </SoftCard>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Brand & Visual Identity */}
        <div className="lg:col-span-1 space-y-6">
          <SoftCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-church-rose/10 flex items-center justify-center text-church-rose">
                <Palette size={16} />
              </div>
              <h2 className="text-base font-bold text-church-navy">Brand & Identity</h2>
            </div>

            <div className="space-y-5">
              {/* Church Logo Dropzone */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-2">
                  Church Logo
                </label>
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-church-cream/30 relative group transition-all hover:border-church-rose/40 hover:bg-church-rose/5">
                  {activeDisplayLogo ? (
                    <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-white shadow-church-soft border border-gray-100 flex items-center justify-center p-2">
                      <img
                        src={activeDisplayLogo}
                        alt="Church Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gray-100 flex flex-col items-center justify-center text-gray-400">
                      <Church size={36} className="mb-1 text-gray-300" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase">No Logo</span>
                    </div>
                  )}

                  <label className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-xs font-bold text-church-navy rounded-full shadow-sm hover:border-church-rose hover:text-church-rose cursor-pointer transition-colors">
                    <Upload size={13} />
                    <span>{activeDisplayLogo ? 'Change Logo' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>

                  <p className="text-[11px] text-gray-400 text-center mt-2">
                    PNG, JPG, or SVG recommended (Square 400×400)
                  </p>
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] font-bold text-church-slate mb-1">
                      <span>Uploading Logo...</span>
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

              {/* Church Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                  Church Display Name
                </label>
                <input
                  type="text"
                  name="churchName"
                  value={formData.churchName}
                  onChange={handleChange}
                  placeholder="e.g. Grace Fellowship Church"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-semibold text-church-navy focus:bg-white focus:border-church-rose focus:ring-2 focus:ring-church-rose/20 focus:outline-none transition-all"
                />
              </div>

              {/* District & Jurisdiction */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                  District / Jurisdiction
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="e.g. Metro Manila District"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-semibold text-church-navy focus:bg-white focus:border-church-rose focus:ring-2 focus:ring-church-rose/20 focus:outline-none transition-all"
                />
              </div>

              {/* Date Organized */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5">
                  Date Organized
                </label>
                <input
                  type="text"
                  name="dateOrganized"
                  value={formData.dateOrganized}
                  onChange={handleChange}
                  placeholder="e.g. October 1998"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-semibold text-church-navy focus:bg-white focus:border-church-rose focus:ring-2 focus:ring-church-rose/20 focus:outline-none transition-all"
                />
              </div>

              {/* Primary Theme Color */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-2">
                  Brand Theme Color
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {THEME_PALETTE.map((c) => {
                    const isSelected = formData.theme.primaryColor?.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => handleChange({ target: { name: 'primaryColor', value: c.hex } }, 'theme')}
                        title={c.name}
                        className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                          isSelected ? 'scale-115 ring-2 ring-offset-2 ring-church-navy shadow-sm' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                    <input
                      type="color"
                      name="primaryColor"
                      value={formData.theme.primaryColor}
                      onChange={(e) => handleChange(e, 'theme')}
                      className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer border-0 p-0"
                    />
                  </div>
                  <input
                    type="text"
                    name="primaryColor"
                    value={formData.theme.primaryColor}
                    onChange={(e) => handleChange(e, 'theme')}
                    className="flex-1 px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-mono font-bold uppercase text-church-navy focus:bg-white focus:border-church-rose focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </SoftCard>

          {/* Financial & Regional Settings */}
          <SoftCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Coins size={16} />
              </div>
              <div>
                <h2 className="text-base font-bold text-church-navy">Currency & Localization</h2>
                <p className="text-[11px] text-church-slate">Configure financial denomination for web & mobile</p>
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
                    placeholder="e.g. AED, ₱, $"
                    className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-bold text-church-navy focus:bg-white focus:border-church-rose focus:outline-none"
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
                      className={`py-1 text-[11px] font-bold rounded-lg transition-all ${
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
                      className={`py-1 text-[11px] font-bold rounded-lg transition-all ${
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
                      className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        formData.currency.decimalPlaces === decimals
                          ? 'border-church-rose bg-church-rose/5 text-church-rose'
                          : 'border-gray-200 bg-gray-50/70 text-church-slate hover:bg-white'
                      }`}
                    >
                      <span>{decimals === 2 ? '2 Decimals (.00)' : 'No Decimals (Integer)'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="p-3.5 bg-gradient-to-br from-church-cream/60 to-white rounded-2xl border border-church-rose/20 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-church-rose block mb-1">
                  Live Display Preview
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-church-slate font-medium">Sample Amount:</span>
                  <span className="text-base font-black text-church-navy">
                    {formatCurrency(1250, formData.currency)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-gray-100">
                  <span className="text-[11px] text-church-slate">Compact (Chart/KPI):</span>
                  <span className="text-xs font-bold text-emerald-600">
                    +{formatCurrency(45000, formData.currency, { compact: true })}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed">
                This configuration automatically updates donation totals, expense logs, financial reports, and the mobile member giving forms.
              </p>
            </div>
          </SoftCard>
        </div>

        {/* Right Column: Contact & Worship Services */}
        <div className="lg:col-span-2 space-y-6">
          {/* Location & Communications */}
          <SoftCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MapPin size={16} />
              </div>
              <div>
                <h2 className="text-base font-bold text-church-navy">Location & Contact</h2>
                <p className="text-[11px] text-church-slate">Congregation address, public inquiries and social presence</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5 flex items-center gap-1.5">
                  <MapPin size={13} className="text-gray-400" />
                  Physical Address
                </label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Building, Street, Barangay, City, Postal Code"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-medium text-church-navy focus:bg-white focus:border-church-rose focus:ring-2 focus:ring-church-rose/20 focus:outline-none resize-none transition-all"
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5 flex items-center gap-1.5">
                    <Phone size={13} className="text-gray-400" />
                    Office Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.contact.phone}
                    onChange={(e) => handleChange(e, 'contact')}
                    placeholder="+63 (02) 8123-4567"
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-medium text-church-navy focus:bg-white focus:border-church-rose focus:ring-2 focus:ring-church-rose/20 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-church-slate mb-1.5 flex items-center gap-1.5">
                    <Mail size={13} className="text-gray-400" />
                    Public Inquiries Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.contact.email}
                    onChange={(e) => handleChange(e, 'contact')}
                    placeholder="office@coramdeochurch.ph"
                    className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-medium text-church-navy focus:bg-white focus:border-church-rose focus:ring-2 focus:ring-church-rose/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Social Channels */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1.5 mb-3">
                  <Share2 size={13} className="text-church-slate" />
                  <span className="text-xs font-bold uppercase tracking-wider text-church-slate">
                    Online Presence & Social Channels
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-church-slate mb-1">
                      Facebook Page
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-blue-600 font-bold text-xs">
                        fb.com/
                      </span>
                      <input
                        type="text"
                        name="facebook"
                        value={formData.social.facebook}
                        onChange={(e) => handleChange(e, 'social')}
                        placeholder="yourchurch"
                        className="w-full pl-17 pr-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:bg-white focus:border-church-rose focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-church-slate mb-1">
                      Instagram Profile
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-pink-600 font-bold text-xs">
                        @
                      </span>
                      <input
                        type="text"
                        name="instagram"
                        value={formData.social.instagram}
                        onChange={(e) => handleChange(e, 'social')}
                        placeholder="yourchurch"
                        className="w-full pl-8 pr-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:bg-white focus:border-church-rose focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-church-slate mb-1">
                      Church Website
                    </label>
                    <div className="relative">
                      <Globe size={13} className="absolute inset-y-0 left-0 my-auto ml-3 text-gray-400" />
                      <input
                        type="text"
                        name="website"
                        value={formData.social.website}
                        onChange={(e) => handleChange(e, 'social')}
                        placeholder="https://..."
                        className="w-full pl-8 pr-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-church-navy focus:bg-white focus:border-church-rose focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SoftCard>

          {/* Service Schedules */}
          <SoftCard className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Clock size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-church-navy">Worship Service Schedules</h2>
                    <StatusPill variant="violet">
                      {formData.serviceSchedules.length} {formData.serviceSchedules.length === 1 ? 'Service' : 'Services'}
                    </StatusPill>
                  </div>
                  <p className="text-[11px] text-church-slate">Weekly regular gatherings published on mobile member feed</p>
                </div>
              </div>

              <button
                type="button"
                onClick={addService}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-church-cream/70 hover:bg-church-cream text-church-navy text-xs font-bold rounded-full border border-gray-200/80 transition-colors self-start sm:self-auto"
              >
                <Plus size={14} className="text-church-rose" />
                <span>Add Service</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.serviceSchedules.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <Calendar size={28} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-xs font-bold text-church-navy">No regular schedules added yet</p>
                  <p className="text-[11px] text-church-slate mt-0.5">Click "Add Service" to configure regular gathering times</p>
                </div>
              ) : (
                formData.serviceSchedules.map((service, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-church-slate shrink-0 shadow-2xs">
                      <Clock size={18} />
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="w-full">
                        <ModernDropdown
                          value={service.day}
                          onChange={(val) => updateService(index, 'day', val)}
                          options={DAYS_OF_WEEK}
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Time (e.g. 09:00 AM)"
                          value={service.time}
                          onChange={(e) => updateService(index, 'time', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-church-navy focus:border-church-rose focus:outline-none"
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Service Name (e.g. Main Service)"
                          value={service.name}
                          onChange={(e) => updateService(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-church-navy focus:border-church-rose focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors self-end sm:self-auto shrink-0"
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
    </div>
  );
}

