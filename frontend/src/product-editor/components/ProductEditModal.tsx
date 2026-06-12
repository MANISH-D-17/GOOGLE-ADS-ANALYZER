import React, { useState, useEffect } from 'react';
import { GMCProduct } from '../services/editorApiService';
import { X, Save, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  product: GMCProduct;
  onClose: () => void;
  onSave: (id: string, fields: Partial<GMCProduct>) => Promise<void>;
}

export const ProductEditModal: React.FC<Props> = ({ product, onClose, onSave }) => {
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description);
  const [imageLink, setImageLink] = useState(product.imageLink);
  const [priceValue, setPriceValue] = useState(product.price.value);
  const [availability, setAvailability] = useState(product.availability);
  const [brand, setBrand] = useState(product.brand);
  const [googleProductCategory, setGoogleProductCategory] = useState(product.googleProductCategory || '');
  
  const [additionalImageLinks, setAdditionalImageLinks] = useState<string[]>(product.additionalImageLinks || []);

  const [saving, setSaving] = useState(false);
  const [imgPreview, setImgPreview] = useState(product.imageLink);

  // Debounce image preview
  useEffect(() => {
    const t = setTimeout(() => setImgPreview(imageLink), 800);
    return () => clearTimeout(t);
  }, [imageLink]);

  const hasChanged = (current: any, original: any) => current !== original;
  
  const handleSave = async () => {
    if (title.length > 150) return alert('Title too long');
    if (description.length > 5000) return alert('Description too long');
    if (!imageLink.startsWith('https://')) return alert('Image URL must be secure (https://)');
    
    const fields: Partial<GMCProduct> = {};
    if (hasChanged(title, product.title)) fields.title = title;
    if (hasChanged(description, product.description)) fields.description = description;
    if (hasChanged(imageLink, product.imageLink)) fields.imageLink = imageLink;
    if (hasChanged(priceValue, product.price.value)) fields.price = { value: priceValue, currency: product.price.currency };
    if (hasChanged(availability, product.availability)) fields.availability = availability;
    if (hasChanged(brand, product.brand)) fields.brand = brand;
    if (hasChanged(googleProductCategory, product.googleProductCategory || '')) fields.googleProductCategory = googleProductCategory;
    if (JSON.stringify(additionalImageLinks) !== JSON.stringify(product.additionalImageLinks || [])) {
      fields.additionalImageLinks = additionalImageLinks;
    }

    if (Object.keys(fields).length === 0) return onClose(); // No changes

    setSaving(true);
    await onSave(product.id, fields);
    setSaving(false);
  };

  const addExtraImage = () => {
    if (additionalImageLinks.length < 10) setAdditionalImageLinks([...additionalImageLinks, '']);
  };
  const removeExtraImage = (index: number) => {
    setAdditionalImageLinks(additionalImageLinks.filter((_, i) => i !== index));
  };
  const updateExtraImage = (index: number, val: string) => {
    const newLinks = [...additionalImageLinks];
    newLinks[index] = val;
    setAdditionalImageLinks(newLinks);
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
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Product</h2>
              <p className="text-xs text-gray-500 font-mono mt-1">{product.id}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
          </div>

          {/* Banner */}
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 flex items-center gap-3 text-amber-800 text-sm font-medium">
            <AlertCircle size={16} className="text-amber-500" />
            Changes take 2–5 minutes to reflect in Google Shopping. Fields with changes are highlighted.
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 flex gap-8">
            <div className="flex-1 space-y-5">
              
              {/* Title */}
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <label className="text-sm font-bold text-gray-700">Product Title</label>
                  <span className={cn("text-xs font-mono", title.length > 150 ? "text-red-500 font-bold" : "text-gray-400")}>
                    {title.length} / 150
                  </span>
                </div>
                <textarea
                  value={title} onChange={(e) => setTitle(e.target.value)}
                  className={cn("w-full rounded-xl border p-3 text-sm focus:ring-2 outline-none transition-all resize-none h-20", 
                    hasChanged(title, product.title) ? "border-amber-400 focus:ring-amber-200 bg-amber-50/10" : "border-gray-200 focus:ring-indigo-100 focus:border-indigo-400"
                  )}
                />
              </div>

              {/* Description */}
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <label className="text-sm font-bold text-gray-700">Description</label>
                  <span className={cn("text-xs font-mono", description.length > 5000 ? "text-red-500 font-bold" : "text-gray-400")}>
                    {description.length} / 5000
                  </span>
                </div>
                <textarea
                  value={description} onChange={(e) => setDescription(e.target.value)}
                  className={cn("w-full rounded-xl border p-3 text-sm focus:ring-2 outline-none transition-all resize-y min-h-[120px]", 
                    hasChanged(description, product.description) ? "border-amber-400 focus:ring-amber-200 bg-amber-50/10" : "border-gray-200 focus:ring-indigo-100 focus:border-indigo-400"
                  )}
                />
              </div>

              {/* Attributes Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Price ({product.price.currency})</label>
                  <input
                    type="number" step="0.01" value={priceValue} onChange={(e) => setPriceValue(e.target.value)}
                    className={cn("w-full rounded-xl border p-3 text-sm focus:ring-2 outline-none transition-all", 
                      hasChanged(priceValue, product.price.value) ? "border-amber-400 focus:ring-amber-200 bg-amber-50/10" : "border-gray-200 focus:ring-indigo-100 focus:border-indigo-400"
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Availability</label>
                  <select
                    value={availability} onChange={(e) => setAvailability(e.target.value)}
                    className={cn("w-full rounded-xl border p-3 text-sm focus:ring-2 outline-none transition-all appearance-none", 
                      hasChanged(availability, product.availability) ? "border-amber-400 focus:ring-amber-200 bg-amber-50/10" : "border-gray-200 focus:ring-indigo-100 focus:border-indigo-400"
                    )}
                  >
                    <option value="in stock">In Stock</option>
                    <option value="out of stock">Out of Stock</option>
                    <option value="preorder">Preorder</option>
                  </select>
                </div>
              </div>

              {/* Brand & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Brand</label>
                  <input
                    type="text" value={brand} onChange={(e) => setBrand(e.target.value)}
                    className={cn("w-full rounded-xl border p-3 text-sm focus:ring-2 outline-none transition-all", 
                      hasChanged(brand, product.brand) ? "border-amber-400 focus:ring-amber-200 bg-amber-50/10" : "border-gray-200 focus:ring-indigo-100 focus:border-indigo-400"
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Google Category</label>
                  <input
                    type="text" value={googleProductCategory} onChange={(e) => setGoogleProductCategory(e.target.value)}
                    placeholder="e.g. Apparel & Accessories > Clothing"
                    className={cn("w-full rounded-xl border p-3 text-sm focus:ring-2 outline-none transition-all", 
                      hasChanged(googleProductCategory, product.googleProductCategory || '') ? "border-amber-400 focus:ring-amber-200 bg-amber-50/10" : "border-gray-200 focus:ring-indigo-100 focus:border-indigo-400"
                    )}
                  />
                </div>
              </div>

            </div>

            {/* Sidebar Images */}
            <div className="w-[300px] flex flex-col gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Main Image URL</label>
                <input
                  type="url" value={imageLink} onChange={(e) => setImageLink(e.target.value)}
                  className={cn("w-full rounded-xl border p-2 text-xs focus:ring-2 outline-none transition-all mb-3", 
                    hasChanged(imageLink, product.imageLink) ? "border-amber-400 focus:ring-amber-200 bg-amber-50/10" : "border-gray-200 focus:ring-indigo-100 focus:border-indigo-400"
                  )}
                />
                <div className="aspect-square bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden flex items-center justify-center">
                  {imgPreview ? (
                    <img src={imgPreview} alt="Preview" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                  ) : (
                    <ImageIcon className="text-gray-300 w-12 h-12" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-bold text-gray-700">Extra Images</label>
                  <button 
                    onClick={addExtraImage} 
                    disabled={additionalImageLinks.length >= 10}
                    className="text-xs text-indigo-600 font-bold hover:text-indigo-800 disabled:opacity-50"
                  >
                    + Add
                  </button>
                </div>
                <div className="space-y-2">
                  {additionalImageLinks.map((link, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="url" value={link} onChange={(e) => updateExtraImage(i, e.target.value)}
                        placeholder="https://"
                        className="flex-1 rounded-lg border border-gray-200 p-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                      />
                      <button onClick={() => removeExtraImage(i)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
                    </div>
                  ))}
                  {additionalImageLinks.length === 0 && (
                    <p className="text-xs text-gray-400 italic">No extra images.</p>
                  )}
                </div>
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
              disabled={saving || title.length > 150 || description.length > 5000}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save to Merchant Center'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
