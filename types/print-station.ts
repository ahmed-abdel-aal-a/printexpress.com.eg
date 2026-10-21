// Types for Dynamic Print Station V14

export interface PrintingProductType {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  allow_custom_name: boolean;
  printing_types?: PrintingType[];
}

export interface PrintingType {
  id: number;
  printing_product_type_id: number;
  name: string;
  description: string | null;
  pricing_method: 'fixed' | 'attributes_only' | 'area';
  is_active: boolean;
  requires_upload: boolean;
  upload_categories: string[] | null;
  upload_rules: {
    max_files_limit?: number | null;
    allow_additional_attachments?: boolean;
    pricing_by_image_count?: boolean;
    allowed_extensions?: string[];
  } | null;
  attributes?: PrintingAttribute[];
}

export interface PrintingAttribute {
  id: number;
  printing_type_id: number;
  name: string;
  label: string;
  type: 'select' | 'radio' | 'checkbox' | 'number' | 'multiplier_number';
  step: 'specifications' | 'finishing';
  is_required: boolean;
  min_value: number | null;
  max_value: number | null;
  conditional_rules: any;
  sort_order: number;
  is_dimension_width: boolean;
  is_dimension_length: boolean;
  values?: PrintingAttributeValue[];
}

export interface PrintingAttributeValue {
  id: number;
  printing_attribute_id: number;
  value: string;
  label: string;
  fixed_price: number;
  unit_price: number;
  multiplier_price: number;
  required_upload_category: string | null;
}

// Main Configuration State (Fully Dynamic V14)
export interface SelectedOption {
  value_id: number;
  multiplier_value?: number;
}

export interface PrintOrderState {
  mainCategoryId: number | null; // printing_product_type_id
  printingTypeId: number | null;
  
  // Dynamic Specifications & Finishings: attribute_id -> SelectedOption
  selectedOptions: Record<number, SelectedOption>;
  
  // Order Details
  quantity: number;
  notes: string;
  uploadedFiles: Record<string, { file_id: string; page_count: number | null; name: string } | File | string>; // Map category -> Uploaded Data
  
  width_mm?: number;
  length_mm?: number;
  image_count?: number;
}

export interface OrderPayload {
  printing_type_id: number;
  quantity: number;
  selected_options: SelectedOption[];
  width_mm?: number;
  length_mm?: number;
  image_count?: number;
  notes: string;
  custom_product_name?: string;
}
