import { useEffect } from 'react';
import type { GalleryImage } from '../types';

interface GalleryModalProps {
  image: GalleryImage;
  onClose: () => void;
}

function GalleryModal({ image, onClose }: GalleryModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal active" onClick={handleBackdropClick}>
      <button className="close-modal" onClick={onClose} aria-label="Close">
        &times;
      </button>
      <div className="modal-content">
        <div className="modal-img">
          <img src={image.image} alt={image.alt} className="modal-main-img" />
        </div>
        <div className="modal-info">
          <h3 className="modal-title">{image.title}</h3>
          <p className="modal-description">{image.description}</p>
        </div>
      </div>
    </div>
  );
}

export default GalleryModal;
