export interface Registration {
  id?: number;
  izena: string;
  abizenak: string;
  email: string;
  menu_type: string;
  konpartsakide_id?: number | null;
  ordainketa_modua: string;
  oharrak?: string | null;
  mote?: string | null;
  created_at?: string;
}
