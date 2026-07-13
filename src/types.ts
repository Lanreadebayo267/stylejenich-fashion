export type PageId = 'home' | 'gallery' | 'about' | 'contact';

export interface CollectionItem {
  id: string;
  image: string;
  alt: string;
  title: string;
  description: string;
}

export interface GalleryImage {
  id: string;
  image: string;
  alt: string;
  title: string;
  description: string;
}

export interface ContactFormValues {
  name: string;
  email: string;
  phone: string;
  message: string;
}
