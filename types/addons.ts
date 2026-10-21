export type ProductAddon = {
  id: string;
  name: string;
  description?: string;
  type: string;
  price: number;
  price_type: 'fixed' | 'percentage';
  requires_upload: boolean;
  allow_multiple_uploads?: boolean;
  max_uploads?: number;
  track_inventory?: boolean;
  quantity: number;
  in_stock: boolean;
};

export type AddonGroup = {
  id: number;
  name: string;
  description?: string;
  input_type: 'checkbox' | 'radio';
  is_required: boolean;
  price_multiplier_type: 'per_item' | 'per_order_line';
  addons: ProductAddon[];
};

export type SelectedAddon = {
  addonId: string;
  groupId: number;
  name: string;
  groupName: string;
  price: number; // The calculated price (fixed or percentage converted to fixed)
  price_multiplier_type: 'per_item' | 'per_order_line';
  requires_upload: boolean;
  temp_file_ids?: string[];
  temp_file_id?: string;
  temp_file_url?: string;
  preview_urls?: string[];
  max_quantity?: number; // For max cap validation
};
