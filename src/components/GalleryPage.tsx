import { useState } from 'react';
import type { GalleryImage } from '../types';
import { galleryImages } from '../data/content';
import GalleryModal from './GalleryModal';

function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  return (
    <section className="page active" id="gallery">
      <div className="container">
        <div className="section-title">
          <span className="eyebrow">The Full Lookbook</span>
          <h2>Design Portfolio</h2>
          <p>Browse through our collection of custom designs. Click on any plate to view details.</p>
        </div>
        <div className="gallery-grid">
          {galleryImages.map((item, index) => (
            <button
              key={item.id}
              className="gallery-item"
              onClick={() => setSelectedImage(item)}
              aria-label={`View details for ${item.title}`}
            >
              <span className="gallery-number">{String(index + 1).padStart(2, '0')}</span>
              <img src={item.image} alt={item.alt} />
            </button>
          ))}
        </div>
      </div>

      {selectedImage && (
        <GalleryModal image={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </section>
  );
}

export default GalleryPage;
