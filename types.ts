
export interface Photo {
  url: string;
  id: string;
  alt: string;
}

export interface Gallery {
  id: string;
  title: string;
  subtitle: string;
  coverImage: string;
  photos: Photo[];
  description: string;
}
