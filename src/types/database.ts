export type UserRole = "customer" | "restaurant" | "admin";
export type OrderStatus =
  | "pending_payment"
  | "payment_claimed"
  | "payment_confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled";
export type MenuCategory =
  | "tovuq"
  | "kabob"
  | "somsa"
  | "osh"
  | "salat"
  | "ichimlik"
  | "shirinlik";
export type DeliveryType = "pickup" | "delivery";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          phone: string;
          telegram_user_id: number | null;
          name: string | null;
          role: UserRole;
          language: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          telegram_user_id?: number | null;
          name?: string | null;
          role?: UserRole;
          language?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          telegram_user_id?: number | null;
          name?: string | null;
          role?: UserRole;
          language?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      restaurants: {
        Row: {
          id: string;
          owner_id: string;
          name_uz: string;
          name_en: string | null;
          description: string | null;
          address: string | null;
          location: unknown | null;
          phone: string | null;
          bank_name: string | null;
          bank_account_number: string | null;
          bank_account_holder: string | null;
          halal_cert_url: string | null;
          photos: string[];
          opening_time: string | null;
          closing_time: string | null;
          is_approved: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name_uz: string;
          name_en?: string | null;
          description?: string | null;
          address?: string | null;
          location?: unknown | null;
          phone?: string | null;
          bank_name?: string | null;
          bank_account_number?: string | null;
          bank_account_holder?: string | null;
          halal_cert_url?: string | null;
          photos?: string[];
          opening_time?: string | null;
          closing_time?: string | null;
          is_approved?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          name_uz?: string;
          name_en?: string | null;
          description?: string | null;
          address?: string | null;
          location?: unknown | null;
          phone?: string | null;
          bank_name?: string | null;
          bank_account_number?: string | null;
          bank_account_holder?: string | null;
          halal_cert_url?: string | null;
          photos?: string[];
          opening_time?: string | null;
          closing_time?: string | null;
          is_approved?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          restaurant_id: string;
          name_uz: string;
          name_en: string | null;
          description: string | null;
          category: MenuCategory | null;
          price_krw: number;
          photo_url: string | null;
          is_available: boolean;
          sold_out_today: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          name_uz: string;
          name_en?: string | null;
          description?: string | null;
          category?: MenuCategory | null;
          price_krw: number;
          photo_url?: string | null;
          is_available?: boolean;
          sold_out_today?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          name_uz?: string;
          name_en?: string | null;
          description?: string | null;
          category?: MenuCategory | null;
          price_krw?: number;
          photo_url?: string | null;
          is_available?: boolean;
          sold_out_today?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          restaurant_id: string;
          status: OrderStatus;
          total_krw: number;
          delivery_type: DeliveryType;
          delivery_address: string | null;
          delivery_lat: number | null;
          delivery_lng: number | null;
          customer_note: string | null;
          payment_receipt_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          restaurant_id: string;
          status?: OrderStatus;
          total_krw: number;
          delivery_type?: DeliveryType;
          delivery_address?: string | null;
          delivery_lat?: number | null;
          delivery_lng?: number | null;
          customer_note?: string | null;
          payment_receipt_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          restaurant_id?: string;
          status?: OrderStatus;
          total_krw?: number;
          delivery_type?: DeliveryType;
          delivery_address?: string | null;
          delivery_lat?: number | null;
          delivery_lng?: number | null;
          customer_note?: string | null;
          payment_receipt_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string | null;
          quantity: number;
          price_at_order: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id?: string | null;
          quantity: number;
          price_at_order: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string | null;
          quantity?: number;
          price_at_order?: number;
        };
        Relationships: [];
      };
      phone_otps: {
        Row: {
          id: string;
          phone: string;
          code: string;
          expires_at: string;
          used: boolean;
          delivered: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          code: string;
          expires_at: string;
          used?: boolean;
          delivered?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          code?: string;
          expires_at?: string;
          used?: boolean;
          delivered?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      ratings: {
        Row: {
          id: string;
          order_id: string;
          customer_id: string | null;
          restaurant_id: string;
          stars: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          customer_id?: string | null;
          restaurant_id: string;
          stars: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          customer_id?: string | null;
          restaurant_id?: string;
          stars?: number;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      restaurants_near: {
        Args: { lat: number; lng: number; radius_km?: number };
        Returns: Array<{
          id: string;
          name_uz: string;
          name_en: string | null;
          description: string | null;
          address: string | null;
          phone: string | null;
          photos: string[];
          opening_time: string | null;
          closing_time: string | null;
          bank_name: string | null;
          bank_account_number: string | null;
          bank_account_holder: string | null;
          distance_km: number;
        }>;
      };
    };
  };
}
