import React, { useState } from "react";
import { usePrintConfig } from "../../../hooks/usePrintConfig";
import { UploadCloud, CheckCircle, Trash2, AlertCircle } from "lucide-react";
import { PrintingType } from "../../../types/print-station";
import { uploadPrintTempFile } from "../../../services/api/printingApi";

interface CategorizedUploaderProps {
  printingType: PrintingType;
  config: ReturnType<typeof usePrintConfig>["config"];
  updateConfig: ReturnType<typeof usePrintConfig>["updateConfig"];
  sessionId: string;
}

export const CategorizedUploader = ({
  printingType,
  config,
  updateConfig,
  sessionId,
}: CategorizedUploaderProps) => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [additionalCategories, setAdditionalCategories] = useState<string[]>([]);

  const recalculateImageCount = (newFiles: Record<string, any>) => {
    if (!printingType.upload_rules?.pricing_by_image_count) return undefined;
    let total = 0;
    Object.values(newFiles).forEach((file: any) => {
      total += file.page_count || 1;
    });
    return total;
  };

  const getRequiredCategories = () => {
    const categories = new Set<string>();
    
    if (printingType.requires_upload && printingType.upload_categories) {
      printingType.upload_categories.forEach(cat => categories.add(cat));
    }
    
    printingType.attributes?.forEach(attr => {
      const selection = config.selectedOptions[attr.id];
      if (selection) {
        const val = attr.values?.find(v => v.id === selection.value_id);
        if (val && val.required_upload_category) {
          categories.add(val.required_upload_category);
        }
      }
    });
    
    return Array.from(categories);
  };

  const baseCategories = getRequiredCategories();
  const categories = [...baseCategories, ...additionalCategories];
  const maxLimit = printingType.upload_rules?.max_files_limit || Infinity;
  const canAddMore = categories.length < maxLimit;

  const handleFileUpload = async (category: string, file: File) => {
    if (file.size > 500 * 1024 * 1024) {
      setUploadErrors(prev => ({ ...prev, [category]: "الملف كبير جداً (الحد الأقصى 500 ميجابايت)" }));
      return;
    }

    setUploadErrors(prev => { const n = {...prev}; delete n[category]; return n; });
    setUploadProgress(prev => ({ ...prev, [category]: 1 }));
    
    try {
      const response = await uploadPrintTempFile(file, category, sessionId, (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [category]: percentCompleted }));
        }
      });

      const newFiles = {
        ...config.uploadedFiles,
        [category]: {
          file_id: response.file_id,
          page_count: response.page_count,
          name: file.name
        }
      };

      const newConfig: any = {
        uploadedFiles: newFiles
      };

      if (printingType.upload_rules?.pricing_by_image_count) {
        newConfig.image_count = recalculateImageCount(newFiles);
      }

      updateConfig(newConfig);
    } catch (error: any) {
      setUploadProgress(prev => { const n = {...prev}; delete n[category]; return n; });
      setUploadErrors(prev => ({ 
        ...prev, 
        [category]: error.response?.data?.error || "حدث خطأ أثناء الرفع، يرجى المحاولة مرة أخرى." 
      }));
    }
  };

  const removeFile = (category: string) => {
    const newFiles = { ...config.uploadedFiles };
    delete newFiles[category];
    const newConfig: any = { uploadedFiles: newFiles };
    
    if (printingType.upload_rules?.pricing_by_image_count) {
      newConfig.image_count = recalculateImageCount(newFiles);
    }
    
    updateConfig(newConfig);
    setUploadProgress(prev => { const n = {...prev}; delete n[category]; return n; });
    
    if (category.startsWith('optional_')) {
      setAdditionalCategories(prev => prev.filter(c => c !== category));
    }
  };

  const addOptionalAttachment = () => {
    if (!canAddMore) return;
    const newId = `optional_${Date.now()}`;
    setAdditionalCategories(prev => [...prev, newId]);
  };

  if (categories.length === 0) {
    return (
      <div className="p-6 rounded-3xl border border-white/10 bg-[#111111] flex flex-col items-center justify-center text-gray-500">
        <CheckCircle size={32} className="mb-2 text-green-500/50" />
        <p>لا توجد ملفات مطلوبة للخيارات التي حددتها.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const uploadedFile = config.uploadedFiles[category] as any;
        const progress = uploadProgress[category] || 0;
        const error = uploadErrors[category];

        let categoryLabel = category;
        if (category === "design") categoryLabel = "ملف التصميم الأساسي";
        else if (category === "spot_uv_mask") categoryLabel = "ملف ماسك الـ Spot UV";
        else if (category === "foil_mask") categoryLabel = "ملف ماسك البصمة";
        else if (category === "cutting_guide") categoryLabel = "ملف دليل القص (Die-cut)";
        else if (category.startsWith("optional_")) categoryLabel = "مرفق إضافي اختياري";

        return (
          <div key={category} className="p-6 rounded-3xl border border-white/10 bg-[#111111] flex flex-col gap-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-yellow-400">
                  {categoryLabel} {!category.startsWith("optional_") && <span className="text-red-500">*</span>}
                </label>
                {category.startsWith("optional_") && !uploadedFile && progress === 0 && (
                  <button onClick={() => removeFile(category)} className="text-xs text-red-500 hover:text-red-400">
                    إلغاء المرفق
                  </button>
                )}
              </div>
              
              {!uploadedFile && progress === 0 && (
                <div 
                  className={`w-full h-32 border-2 border-dashed rounded-xl flex items-center justify-center transition-colors cursor-pointer relative bg-[#1a1a1a] ${error ? "border-red-500/50 text-red-400" : "border-white/20 text-gray-500 hover:border-yellow-400 hover:text-yellow-400"}`}
                >
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    accept=".pdf,.ai,.psd,.zip,.rar"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(category, e.target.files[0]);
                      }
                    }}
                  />
                  <div className="flex flex-col items-center gap-2">
                    <UploadCloud size={32} />
                    <span className="text-sm font-bold">اضغط هنا لرفع الملف (PDF, AI, PSD, ZIP)</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-2 text-xs font-bold text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {progress > 0 && progress < 100 && (
                <div className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4">
                  <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                    <span>جاري رفع {categoryLabel}...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {uploadedFile && (
                <div className="w-full bg-[#1a1a1a] border border-green-500/30 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center">
                      <CheckCircle size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-sm">{uploadedFile.name || "تم رفع الملف بنجاح"}</span>
                      {uploadedFile.page_count && (
                        <span className="text-xs text-yellow-400 mt-1">عدد الصفحات: {uploadedFile.page_count}</span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFile(category)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {printingType.upload_rules?.allow_additional_attachments && canAddMore && (
        <button 
          onClick={addOptionalAttachment}
          className="w-full p-4 border border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/50 transition-colors flex items-center justify-center gap-2"
        >
          <UploadCloud size={20} />
          إضافة مرفق إضافي اختياري
        </button>
      )}
    </div>
  );
};
