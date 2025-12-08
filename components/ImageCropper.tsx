import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import styles from './ImageCropper.module.css';

interface ImageCropperProps {
  image: string;
  type: 'avatar' | 'banner';
  onCropComplete: (croppedAreaPixels: any) => void;
  onCancel: () => void;
}

export default function ImageCropper({ image, type, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const aspectRatio = type === 'avatar' ? 1 : 16 / 9;

  const handleCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = () => {
    if (croppedAreaPixels) {
      onCropComplete(croppedAreaPixels);
    }
  };

  return (
    <div className={styles.cropperModal}>
      <div className={styles.cropperContainer}>
        <div className={styles.cropperHeader}>
          <h3>Crop {type === 'avatar' ? 'Avatar' : 'Banner'}</h3>
          <button onClick={onCancel} className={styles.closeButton}>✕</button>
        </div>
        
        <div className={styles.cropArea}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className={styles.controls}>
          <label className={styles.zoomLabel}>
            <span>Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className={styles.zoomSlider}
            />
          </label>
        </div>

        <div className={styles.actions}>
          <button onClick={onCancel} className={styles.cancelButton}>
            Cancel
          </button>
          <button onClick={handleConfirm} className={styles.confirmButton}>
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
