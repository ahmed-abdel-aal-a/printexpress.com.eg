"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { AddonGroup, ProductAddon, SelectedAddon } from "@/types/addons";
import { Upload, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { getTranslatedText } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";

interface ProductAddonsSelectorProps {
  groups: AddonGroup[];
  currentPrice: number;
  onSelectionChange: (selectedAddons: SelectedAddon[], isValid: boolean) => void;
}

export function ProductAddonsSelector({
  groups,
  currentPrice,
  onSelectionChange,
}: ProductAddonsSelectorProps) {
  const { sessionId } = useAppContext();
  const [selectedMap, setSelectedMap] = useState<Record<string, SelectedAddon>>({});
  const [uploadingAddonId, setUploadingAddonId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string | number) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [String(groupId)]: !prev[String(groupId)],
    }));
  };

  // Check validity
  useEffect(() => {
    let isValid = true;
    groups.forEach((g) => {
      if (g.is_required) {
        const hasSelection = Object.values(selectedMap).some((s) => s.groupId === g.id);
        if (!hasSelection) isValid = false;
      }
    });

    // Also check if any selected addon requires upload but has no file
    Object.values(selectedMap).forEach((s) => {
      if (s.requires_upload && (!s.temp_file_ids || s.temp_file_ids.length === 0)) {
        isValid = false;
      }
    });

    onSelectionChange(Object.values(selectedMap), isValid);
  }, [selectedMap, groups, onSelectionChange]);

  // Recalculate percentage addons when currentPrice changes (Stale Price Trap Fix)
  useEffect(() => {
    setSelectedMap((prev) => {
      let changed = false;
      const newMap = { ...prev };
      
      Object.keys(newMap).forEach((addonId) => {
        for (const group of groups) {
          const addon = group.addons.find((a) => a.id === addonId);
          if (addon && addon.price_type === "percentage") {
            const newPrice = (addon.price / 100) * currentPrice;
            if (newMap[addonId].price !== newPrice) {
              newMap[addonId] = { ...newMap[addonId], price: newPrice };
              changed = true;
            }
            break; // found the addon, no need to check other groups
          }
        }
      });
      
      return changed ? newMap : prev;
    });
  }, [currentPrice, groups]);

  const handleToggleAddon = (group: AddonGroup, addon: ProductAddon, isSelected: boolean) => {
    setSelectedMap((prev) => {
      const newMap = { ...prev };

      if (group.input_type === "radio") {
        // Remove all other selections from this group
        Object.keys(newMap).forEach((key) => {
          if (newMap[key].groupId === group.id) {
            delete newMap[key];
          }
        });
      }

      if (isSelected) {
        const calculatedPrice =
          addon.price_type === "percentage"
            ? (addon.price / 100) * currentPrice
            : addon.price;

        newMap[addon.id] = {
          addonId: addon.id,
          groupId: group.id,
          name: addon.name,
          groupName: group.name,
          price: calculatedPrice,
          price_multiplier_type: group.price_multiplier_type,
          requires_upload: addon.requires_upload,
          max_quantity: addon.track_inventory ? addon.quantity : undefined,
          temp_file_ids: [],
        };
      } else {
        delete newMap[addon.id];
      }

      return newMap;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, addonId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAddonId(addonId);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", "product_addon");
      if (sessionId) {
        formData.append("session_id", sessionId);
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2080/api/v1';
      const headers: Record<string, string> = {};
      if (sessionId) {
        headers['X-Session-ID'] = sessionId;
      }

      const res = await fetch(`${API_URL}/storefront/print/temp-upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) throw new Error("فشل الرفع");

      const data = await res.json();
      
      setSelectedMap((prev) => {
        if (!prev[addonId]) return prev;
        const existingFiles = prev[addonId].temp_file_ids || [];
        return {
          ...prev,
          [addonId]: {
            ...prev[addonId],
            temp_file_ids: [...existingFiles, data.file_id],
          }
        };
      });

    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء رفع الملف");
    } finally {
      setUploadingAddonId(null);
    }
  };

  const removeFile = (addonId: string, fileIdToRemove: string) => {
    setSelectedMap((prev) => {
      if (!prev[addonId]) return prev;
      const existingFiles = prev[addonId].temp_file_ids || [];
      return {
        ...prev,
        [addonId]: {
          ...prev[addonId],
          temp_file_ids: existingFiles.filter(id => id !== fileIdToRemove),
        }
      };
    });
  };

  if (!groups || groups.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 mt-8 w-full">
      {groups.map((group) => (
        <div key={group.id} className="bg-[#1a1a1a] rounded-2xl p-6 border border-white/[0.06]">
          <button
            type="button"
            onClick={() => toggleGroup(group.id)}
            className="w-full flex items-center gap-2 mb-4 cursor-pointer outline-none transition-opacity hover:opacity-80"
          >
            <h3 className="font-bold text-white text-lg">{getTranslatedText(group.name)}</h3>
            {group.is_required && (
              <span className="text-red-500 text-xs font-bold bg-red-500/10 px-2 py-1 rounded-full">
                إجباري
              </span>
            )}
            <span className="text-gray-500 text-sm mr-auto">
              {group.price_multiplier_type === "per_item" ? "لكل قطعة" : "لكل الطلب"}
            </span>
            <div className="text-gray-400 shrink-0">
              {expandedGroups[String(group.id)] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>

          {expandedGroups[String(group.id)] && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              {group.description && (
                <p className="text-gray-400 text-sm mb-4">{getTranslatedText(group.description)}</p>
              )}

              <div className="flex flex-col gap-3">
            {group.addons.map((addon) => {
              const isSelected = !!selectedMap[addon.id];
              const isDisabled = !addon.in_stock;

              const calculatedPrice =
                addon.price_type === "percentage"
                  ? (addon.price / 100) * currentPrice
                  : addon.price;

              return (
                <div key={addon.id} className={`flex flex-col p-4 rounded-xl border transition-colors ${isSelected ? 'border-yellow-400 bg-yellow-400/5' : 'border-white/10 hover:border-white/20'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type={group.input_type}
                      name={`group-${group.id}`}
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={(e) => handleToggleAddon(group, addon, e.target.checked)}
                      className="w-5 h-5 accent-yellow-400"
                    />
                    <div className="flex flex-col flex-1">
                      <span className="text-white font-medium flex items-center gap-2">
                        {getTranslatedText(addon.name)}
                        {isDisabled && <span className="text-red-400 text-xs">(نفدت الكمية)</span>}
                      </span>
                      {addon.description && (
                        <span className="text-gray-400 text-sm">{getTranslatedText(addon.description)}</span>
                      )}
                    </div>
                    {calculatedPrice > 0 && (
                      <div className="text-yellow-400 font-bold">
                        +{calculatedPrice.toFixed(2)} ج.م
                      </div>
                    )}
                  </label>

                  {/* File Upload Section */}
                  {isSelected && addon.requires_upload && (
                    <div className="mt-4 pt-4 border-t border-white/10 pr-8">
                      {(!selectedMap[addon.id]?.temp_file_ids || selectedMap[addon.id]!.temp_file_ids!.length < (addon.allow_multiple_uploads ? (addon.max_uploads || 1) : 1)) && (
                        <div>
                          <input
                            type="file"
                            id={`file-${addon.id}`}
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, addon.id)}
                            accept=".pdf,.ai,.psd,.zip,.rar,.jpg,.jpeg,.png,.webp"
                            multiple={addon.allow_multiple_uploads}
                          />
                          <label
                            htmlFor={`file-${addon.id}`}
                            className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-yellow-400 hover:text-yellow-400 transition-colors text-gray-400"
                          >
                            {uploadingAddonId === addon.id ? (
                              <>
                                <Loader2 size={20} className="animate-spin" /> جاري الرفع...
                              </>
                            ) : (
                              <>
                                <Upload size={20} /> اختر ملف التصميم/الصورة
                              </>
                            )}
                          </label>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            الامتدادات المدعومة: pdf, ai, psd, zip, rar, jpg, png
                          </p>
                        </div>
                      )}
                      
                      {selectedMap[addon.id]?.temp_file_ids && selectedMap[addon.id]!.temp_file_ids!.length > 0 && (
                        <div className="mt-3 flex flex-col gap-2">
                          {selectedMap[addon.id]!.temp_file_ids!.map((fileId, index) => (
                            <div key={fileId} className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                              <span className="text-green-500 text-sm font-bold">✓ تم رفع الملف #{index + 1} بنجاح</span>
                              <button
                                onClick={() => removeFile(addon.id, fileId)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <X size={20} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
