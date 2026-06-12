import React, { useState } from 'react';
import { X, Save, PackagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onClose: () => void;
  onCreate: (fields: any) => Promise<void>;
}

export const ProductCreateModal: React.FC<Props> = ({ onClose, onCreate }) => {
  const [offerId, setOfferId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [imageLink, setImageLink] = useState('');
  const [priceValue, setPriceValue] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [availability, setAvailability] = useState('in stock');
  const [brand, setBrand] = useState('');
  const [googleProductCategory, setGoogleProductCategory] = useState('');
  
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!offerId || !title || !description || !link || !imageLink || !priceValue) {
      return alert('Please fill all mandatory fields (SKU, Title, Desc, Link, Image, Price).');
    }

    const payload = {
      offerId,
      title,
      description,
      link,
      imageLink,
      contentLanguage: "en",
      targetCountry: "US",
      channel: "online",
      availability,
      condition: "new",
      price: { value: priceValue, currency },
      brand: brand || undefined,
      googleProductCategory: googleProductCategory || undefined
    };

    setSaving(true);
    await onCreate(payload);
    setSaving(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <PackagePlus className="text-indigo-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">SKU (Offer ID) *</label>
                <input
                  type="text" value={offerId} onChange={(e) => setOfferId(e.target.value)}
                  placeholder="e.g. SKU-12345"
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Product Link *</label>
                <input
                  type="url" value={link} onChange={(e) => setLink(e.target.value)}
                  placeholder="https://yourstore.com/product"
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-1.5 block">Title *</label>
              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-1.5 block">Description *</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none resize-y h-24"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-1.5 block">Image URL *</label>
              <input
                type="url" value={imageLink} onChange={(e) => setImageLink(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Price *</label>
                <input
                  type="number" step="0.01" value={priceValue} onChange={(e) => setPriceValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Currency</label>
                <select
                  value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none bg-white"
                >
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Availability</label>
                <select
                  value={availability} onChange={(e) => setAvailability(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none bg-white"
                >
                  <option value="in stock">In Stock</option>
                  <option value="out of stock">Out of Stock</option>
                  <option value="preorder">Preorder</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Brand</label>
                <input
                  type="text" value={brand} onChange={(e) => setBrand(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-700 mb-1.5 block">Google Category</label>
                <input
                  type="text" value={googleProductCategory} onChange={(e) => setGoogleProductCategory(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
