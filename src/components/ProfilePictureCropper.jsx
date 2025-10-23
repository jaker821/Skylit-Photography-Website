import React, { useState, useRef, useCallback } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

const ProfilePictureCropper = ({ imageSrc, onCropComplete, onCancel, isCircular = true }) => {
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [aspect, setAspect] = useState(isCircular ? 1 : 4/3) // Square for profile, 4:3 for about page
  const [error, setError] = useState('')
  const imgRef = useRef(null)
  const previewCanvasRef = useRef(null)

  // Add error boundary
  React.useEffect(() => {
    if (!imageSrc) {
      setError('No image provided')
      return
    }
    setError('')
  }, [imageSrc])

  // Compress image (different sizes for profile vs about photos)
  const compressImage = useCallback((canvas, quality = 0.8) => {
    // Create a new canvas for compression
    const compressedCanvas = document.createElement('canvas')
    const ctx = compressedCanvas.getContext('2d')
    
    // Set compressed dimensions based on use case
    const maxSize = isCircular ? 200 : 400 // Profile pics: 200px, About photos: 400px
    let { width, height } = canvas
    
    if (width > height) {
      if (width > maxSize) {
        height = (height * maxSize) / width
        width = maxSize
      }
    } else {
      if (height > maxSize) {
        width = (width * maxSize) / height
        height = maxSize
      }
    }
    
    compressedCanvas.width = width
    compressedCanvas.height = height
    
    // Draw compressed image
    ctx.drawImage(canvas, 0, 0, width, height)
    
    // Convert to blob with compression
    return new Promise((resolve) => {
      compressedCanvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/jpeg', quality)
    })
  }, [isCircular])

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
        },
        aspect,
        width,
        height
      ),
      width,
      height
    )
    setCrop(crop)
  }, [aspect])

  // Update preview canvas when crop, scale, or rotation changes
  React.useEffect(() => {
    if (completedCrop && imgRef.current && previewCanvasRef.current) {
      const image = imgRef.current
      const canvas = previewCanvasRef.current
      const crop = completedCrop

      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('No 2d context')
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const pixelRatio = window.devicePixelRatio
      canvas.width = crop.width * pixelRatio
      canvas.height = crop.height * pixelRatio

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      ctx.imageSmoothingQuality = 'high'

      // Apply transformations
      ctx.save()
      
      // Apply rotation
      if (rotate !== 0) {
        ctx.translate(crop.width / 2, crop.height / 2)
        ctx.rotate((rotate * Math.PI) / 180)
        ctx.translate(-crop.width / 2, -crop.height / 2)
      }

      // Apply scale
      if (scale !== 1) {
        ctx.scale(scale, scale)
      }

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      )
      
      ctx.restore()
    }
  }, [completedCrop, scale, rotate])

  const onDownloadCropClick = useCallback(async () => {
    try {
      if (!previewCanvasRef.current) {
        throw new Error('Crop canvas does not exist')
      }

      // Get the cropped canvas
      const canvas = previewCanvasRef.current
      
      // Compress the image for profile picture
      const compressedBlob = await compressImage(canvas, 0.8)
      
      if (!compressedBlob) {
        throw new Error('Failed to create compressed blob')
      }
      
      onCropComplete(compressedBlob)
    } catch (error) {
      console.error('Error cropping image:', error)
      setError(`Failed to process image: ${error.message}`)
    }
  }, [onCropComplete, compressImage])

  const handleSave = () => {
    onDownloadCropClick()
  }

  if (error) {
    return (
      <div className="profile-picture-cropper">
        <div className="cropper-header">
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
        <div className="cropper-actions">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onCancel}
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-picture-cropper">
      <div className="cropper-header">
        <h3>📸 Crop Your Photo</h3>
        <p>Adjust the crop area and settings to frame your photo perfectly</p>
      </div>

      <div className="cropper-container">
        <div className="image-container">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            minWidth={50}
            minHeight={50}
            circularCrop={isCircular}
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imageSrc}
              style={{ 
                transform: `scale(${scale}) rotate(${rotate}deg)`,
                maxHeight: '400px',
                maxWidth: '400px'
              }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>

        <div className="cropper-controls">
          <div className="control-group">
            <label>Zoom</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
            />
            <span>{Math.round(scale * 100)}%</span>
          </div>

          <div className="control-group">
            <label>Rotate</label>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={rotate}
              onChange={(e) => setRotate(Number(e.target.value))}
            />
            <span>{rotate}°</span>
          </div>

          <div className="control-group">
            <label>Aspect Ratio</label>
            <select value={aspect} onChange={(e) => setAspect(Number(e.target.value))}>
              {isCircular ? (
                <>
                  <option value={1}>Square (1:1)</option>
                  <option value={4/3}>4:3</option>
                  <option value={3/4}>3:4</option>
                </>
              ) : (
                <>
                  <option value={4/3}>4:3 (Landscape)</option>
                  <option value={3/4}>3:4 (Portrait)</option>
                  <option value={16/9}>16:9 (Wide)</option>
                  <option value={1}>Square (1:1)</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="cropper-preview">
          <h4>Preview</h4>
          <div className="preview-container">
            <canvas
              ref={previewCanvasRef}
              style={{
                width: 100,
                height: isCircular ? 100 : 75,
                borderRadius: isCircular ? '50%' : '8px',
                border: '2px solid var(--accent-gold)',
                objectFit: 'cover'
              }}
            />
          </div>
        </div>
      </div>

      <div className="cropper-actions">
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={onCancel}
          style={{ minWidth: '120px', padding: '12px 24px' }}
        >
          Cancel
        </button>
        <button 
          type="button" 
          className="btn btn-primary" 
          onClick={handleSave}
          style={{ minWidth: '120px', padding: '12px 24px' }}
        >
          Approve & Save
        </button>
      </div>
    </div>
  )
}

export default ProfilePictureCropper
