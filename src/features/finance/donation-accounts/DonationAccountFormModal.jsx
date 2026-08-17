import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { collection, doc, setDoc, serverTimestamp, getDocs, writeBatch, query, where } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';

export default function DonationAccountFormModal({ isOpen, onClose, account, accounts }) {
  const { userProfile } = useAuth();
  const CHURCH_ID = userProfile?.churchId;
  
  const [formData, setFormData] = useState({
    displayName: '',
    bankName: '',
    accountName: '',
    accountNumber: '',
    branchName: '',
    instructions: '',
    isPrimary: false,
    isActive: true,
    displayOrder: 0,
  });

  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (account) {
      setFormData({
        displayName: account.displayName || '',
        bankName: account.bankName || '',
        accountName: account.accountName || '',
        accountNumber: account.accountNumber || '',
        branchName: account.branchName || '',
        instructions: account.instructions || '',
        isPrimary: account.isPrimary || false,
        isActive: account.isActive !== undefined ? account.isActive : true,
        displayOrder: account.displayOrder || 0,
      });
      setQrPreview(account.qrImagePath || null);
    } else {
      setFormData({
        displayName: '',
        bankName: '',
        accountName: '',
        accountNumber: '',
        branchName: '',
        instructions: '',
        isPrimary: accounts?.length === 0, // Auto-primary if it's the first account
        isActive: true,
        displayOrder: accounts ? accounts.length : 0,
      });
      setQrPreview(null);
    }
    setQrFile(null);
    setUploadProgress(0);
    setError('');
  }, [account, isOpen, accounts]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      setQrFile(file);
      setQrPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveQr = () => {
    setQrFile(null);
    setQrPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!CHURCH_ID) return;
    
    setLoading(true);
    setError('');

    try {
      const accountsColRef = collection(db, 'donationAccounts');
      const docRef = account ? doc(db, 'donationAccounts', account.id) : doc(accountsColRef);
      
      let qrImagePath = qrPreview;

      // Handle file upload if there's a new file
      if (qrFile) {
        const timestamp = new Date().getTime();
        const storageRef = ref(storage, `donationAccounts/${CHURCH_ID}/${docRef.id}_qr_${timestamp}_${qrFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, qrFile);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (err) => reject(err),
            async () => {
              qrImagePath = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      // Handle batch if isPrimary is true and needs to clear other primaries
      let batch = writeBatch(db);
      
      if (formData.isPrimary) {
        const q = query(
          collection(db, 'donationAccounts'), 
          where('churchId', '==', CHURCH_ID)
        );
        const allAccounts = await getDocs(q);
        
        allAccounts.forEach((docSnap) => {
          if (docSnap.id !== docRef.id && docSnap.data().isPrimary === true) {
            batch.update(docSnap.ref, { isPrimary: false, updatedAt: serverTimestamp(), updatedBy: userProfile.uid });
          }
        });
      }

      const accountDoc = {
        ...formData,
        displayOrder: parseInt(formData.displayOrder) || 0,
        type: 'bank',
        churchId: CHURCH_ID,
        qrImagePath: qrPreview ? qrImagePath : null, // If preview is null, remove the image
        updatedAt: serverTimestamp(),
        updatedBy: userProfile.uid
      };

      if (!account) {
        accountDoc.createdAt = serverTimestamp();
        accountDoc.createdBy = userProfile.uid;
      }

      batch.set(docRef, accountDoc, { merge: true });
      await batch.commit();

      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to save donation account. Please try again.');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-church-soft overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-church-bg">
          <h2 className="text-xl font-bold text-church-navy">{account ? 'Edit Donation Account' : 'Add Donation Account'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">{error}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-church-navy mb-1.5">Display Name *</label>
                <input 
                  type="text" 
                  name="displayName"
                  required
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="e.g. Main Church Bank"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-church-green focus:border-transparent transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-church-navy mb-1.5">Bank Name *</label>
                <input 
                  type="text" 
                  name="bankName"
                  required
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="e.g. Producers Savings Bank"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-church-green focus:border-transparent transition-all" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-church-navy mb-1.5">Account Name *</label>
                <input 
                  type="text" 
                  name="accountName"
                  required
                  value={formData.accountName}
                  onChange={handleChange}
                  placeholder="e.g. Casubiduan Church of the Nazarene"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-church-green focus:border-transparent transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-church-navy mb-1.5">Account Number *</label>
                <input 
                  type="text" 
                  name="accountNumber"
                  required
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="e.g. 1234567890"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-church-green focus:border-transparent transition-all font-mono" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-church-navy mb-1.5">Branch (Optional)</label>
                <input 
                  type="text" 
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleChange}
                  placeholder="e.g. Main Branch"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-church-green focus:border-transparent transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-church-navy mb-1.5">Display Order</label>
                <input 
                  type="number" 
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-church-green focus:border-transparent transition-all" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-church-navy mb-1.5">Transfer Instructions (Optional)</label>
              <textarea 
                name="instructions"
                rows="2"
                value={formData.instructions}
                onChange={handleChange}
                placeholder="Any specific instructions for members transferring to this account..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-church-green focus:border-transparent transition-all resize-none" 
              />
            </div>

            {/* Toggles */}
            <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-4 sm:space-y-0 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" name="isActive" className="sr-only" checked={formData.isActive} onChange={handleChange} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-church-green' : 'bg-gray-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.isActive ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <div className="ml-3 text-sm font-bold text-church-navy">
                  Active Account
                  <p className="text-xs font-normal text-gray-500">Available for new giving</p>
                </div>
              </label>

              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" name="isPrimary" className="sr-only" checked={formData.isPrimary} onChange={handleChange} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${formData.isPrimary ? 'bg-church-green' : 'bg-gray-300'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.isPrimary ? 'transform translate-x-4' : ''}`}></div>
                </div>
                <div className="ml-3 text-sm font-bold text-church-navy">
                  Primary Account
                  <p className="text-xs font-normal text-gray-500">Shown first in mobile app</p>
                </div>
              </label>
            </div>

            {/* QR Upload */}
            <div>
              <label className="block text-sm font-bold text-church-navy mb-1.5">Official Receiving QR (Optional)</label>
              
              {!qrPreview ? (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-2xl hover:bg-gray-50 hover:border-church-green/50 transition-colors cursor-pointer group relative">
                  <input id="qr-upload" name="qr-upload" type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*" />
                  <div className="space-y-1 text-center">
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="h-6 w-6 text-church-green" />
                    </div>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <span className="font-bold text-church-green">Click to upload</span>
                      <span className="pl-1">or drag and drop</span>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl border-2 border-gray-200 overflow-hidden bg-gray-50 flex flex-col items-center justify-center p-4">
                  <button 
                    type="button"
                    onClick={handleRemoveQr}
                    className="absolute top-2 right-2 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors shadow-sm z-10"
                    title="Remove QR"
                  >
                    <Trash2 size={16} />
                  </button>
                  <img src={qrPreview} alt="QR Preview" className="max-h-48 object-contain rounded-xl shadow-sm border border-gray-200 bg-white" />
                  <p className="mt-3 text-sm text-gray-500 font-medium">Official QR Image</p>
                </div>
              )}
              
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
                  <div className="bg-church-green h-full rounded-full transition-all duration-300 relative" style={{ width: `${uploadProgress}%` }}>
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 flex justify-end space-x-3 border-t border-gray-100">
              <button 
                type="button" 
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-bold text-church-slate hover:bg-gray-50 hover:text-church-navy transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-8 py-2.5 bg-church-green text-white rounded-full text-sm font-bold hover:bg-church-green/90 transition-all shadow-sm hover:shadow disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
