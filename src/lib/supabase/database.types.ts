// Hand-written placeholder types. Regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
// or via the Supabase MCP after the schema is applied.
//
// Keep this in sync with supabase/schema.sql.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: {
          id: string;
          slug: string;
          name: string;
          brand: string | null;
          model: string | null;
          trim: string | null;
          origin: "cn" | "ae";
          type: "ev" | "reev" | "phev" | "hybrid";
          body:
            | "sedan"
            | "suv"
            | "hatchback"
            | "coupe"
            | "wagon"
            | "pickup"
            | "mpv"
            | "convertible"
            | null;
          drive_type: "fwd" | "rwd" | "awd" | "4wd" | null;
          year: number;
          price_egp: number;
          price_usd: number | null;
          transmission: string | null;
          drivetrain: string | null;
          range_km: number | null;
          image_url: string | null;
          gallery: string[] | null;
          features: Record<string, string[]> | null;
          specs: Json;
          is_featured: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["vehicles"]["Row"],
          | "id"
          | "created_at"
          | "updated_at"
          | "specs"
          | "is_featured"
          | "is_published"
          | "gallery"
          | "features"
          | "brand"
          | "model"
          | "trim"
          | "body"
          | "drive_type"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          specs?: Json;
          is_featured?: boolean;
          is_published?: boolean;
          gallery?: string[] | null;
          features?: Record<string, string[]> | null;
          brand?: string | null;
          model?: string | null;
          trim?: string | null;
          body?:
            | "sedan"
            | "suv"
            | "hatchback"
            | "coupe"
            | "wagon"
            | "pickup"
            | "mpv"
            | "convertible"
            | null;
          drive_type?: "fwd" | "rwd" | "awd" | "4wd" | null;
        };
        Update: Partial<Database["public"]["Tables"]["vehicles"]["Insert"]>;
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          vehicle_interest: string | null;
          message: string | null;
          source: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["leads"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [];
      };
      calculator_config: {
        Row: {
          id: number;
          egp_rate: number;
          freight_cn: number;
          freight_ae: number;
          transit_cn: number;
          transit_ae: number;
          tax_ev: number;
          tax_reev: number;
          tax_phev: number;
          vat: number;
          insurance_rate: number;
          clearance_usd: number;
          inland_delivery_usd: number;
          consulting_fee_pct: number;
          payment_usd_fee: number;
          payment_bank_fee: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["calculator_config"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["calculator_config"]["Row"]>;
        Relationships: [];
      };
      news: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          body_md: string | null;
          cover_image_url: string | null;
          published_at: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["news"]["Row"],
          "id" | "created_at" | "updated_at" | "is_published"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          is_published?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["news"]["Insert"]>;
        Relationships: [];
      };
      page_heroes: {
        Row: {
          page_slug: string;
          image_url: string | null;
          alt: string | null;
          height_vh: number;
          border_radius_px: number;
          opacity: number;
          overlay_color: string;
          overlay_opacity: number;
          is_enabled: boolean;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["page_heroes"]["Row"]> & {
          page_slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["page_heroes"]["Row"]>;
        Relationships: [];
      };
      page_sections: {
        Row: {
          id: string;
          page_slug: string;
          position: number;
          type:
            | "paragraph"
            | "image"
            | "heading"
            | "rich_text"
            | "gallery"
            | "list"
            | "cta"
            | "spacer"
            | "divider"
            | "embed"
            | "page_header"
            | "hero_block"
            | "marquee"
            | "manifesto"
            | "fleet_grid"
            | "calculator_widget"
            | "routes"
            | "process"
            | "testimonials"
            | "stats_grid"
            | "cta_block"
            | "qa"
            | "legal_clause";
          data: Json;
          is_visible: boolean;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["page_sections"]["Row"],
          "id" | "updated_at" | "is_visible" | "data"
        > & {
          id?: string;
          updated_at?: string;
          is_visible?: boolean;
          data?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["page_sections"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
