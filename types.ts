export interface BusinessIdea {
  id: number;
  title: string;
  category: string;
  description: string;
  whyItWorks: string;
  budget: string;
  content?: string; // Le texte complet et détaillé de l'activité
}

export enum Category {
  TECH = "Technologie & IA",
  SERVICE = "Services B2B",
  INDUSTRIAL = "Industriel & Physique",
  FINANCE = "Finance & Légal",
  CREATIVE = "Créatif & Design",
  ADMIN = "Administratif & Conformité"
}