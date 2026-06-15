export interface Registration {
  id?: number;
  izena: string;
  abizenak: string;
  email: string;
  menu_type: string;
  konpartsakide_id?: number | null;
  konpartsakide_izena?: string | null;
  ordainketa_modua: string;
  oharrak?: string | null;
  mote?: string | null;
  is_paid?: number;
  created_at?: string;
}
