export interface Product {
  name: string;
  category: string;
  url: string;
  github?: string;
  description: string;
}

export interface Leader {
  name: string;
  twitter?: string;
  blog?: string;
  youtube?: string;
  topics: string[];
}

export interface WhitelistConfig {
  products: Product[];
  leaders: Leader[];
  sources: {
    productHunt: {
      enabled: boolean;
      tags: string[];
    };
    github: {
      enabled: boolean;
      topics: string[];
    };
    hackernews: {
      enabled: boolean;
      keywords: string[];
    };
  };
}

export interface ResearchResult {
  newProducts: ProductDiscovery[];
  whitelistUpdates: ProductUpdate[];
  insights: TechnicalInsight[];
  generatedAt: string;
}

export interface ProductDiscovery {
  title: string;
  description: string;
  url?: string;
  source: string;
  category?: string;
  relevanceScore?: number;
}

export interface ProductUpdate {
  productName: string;
  title: string;
  description: string;
  updateType: 'feature' | 'bugfix' | 'announcement' | 'release';
  url?: string;
  date?: string;
}

export interface TechnicalInsight {
  title: string;
  description: string;
  author?: string;
  source: string;
  url?: string;
  topics: string[];
  type: 'technical' | 'opinion' | 'tutorial' | 'discussion';
}
