import { useRef, useState } from 'react'
import UploadIcon from './UploadIcon'
import './VideoDropzone.css'

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime']
const ACCEPTED_EXTENSIONS = ['.mp4', '.mov']
const MAX_SIZE_BYTES = 50 * 1024 * 1024

function isAcceptedVideo(file) {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  return ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext)
}

export default function VideoDropzone({ file, onFileSelect, disabled = false }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState('')

  const validateAndSelect = (selectedFile) => {
    if (!selectedFile) return

    if (!isAcceptedVideo(selectedFile)) {
      setValidationError('Only MP4 and MOV video files are accepted.')
      return
    }

    if (selectedFile.size > MAX_SIZE_BYTES) {
      setValidationError('File exceeds the 50MB size limit.')
      return
    }

    setValidationError('')
    onFileSelect(selectedFile)
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled) return
    validateAndSelect(e.dataTransfer.files[0])
  }

  const handleInputChange = (e) => {
    validateAndSelect(e.target.files[0])
    e.target.value = ''
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!disabled) inputRef.current?.click()
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="video-dropzone-wrapper">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload video file"
        aria-disabled={disabled}
        className={`video-dropzone${isDragging ? ' video-dropzone--active' : ''}${disabled ? ' video-dropzone--disabled' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={handleKeyDown}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp4,.mov,video/mp4,video/quicktime"
          className="video-dropzone__input"
          onChange={handleInputChange}
          disabled={disabled}
          tabIndex={-1}
        />

        <UploadIcon className="video-dropzone__icon" />

        {file ? (
          <>
            <p className="video-dropzone__title">{file.name}</p>
            <p className="video-dropzone__hint">{formatSize(file.size)} · Click or drop to replace</p>
          </>
        ) : (
          <>
            <p className="video-dropzone__title">
              {isDragging ? 'Drop your video here' : 'Drag & drop your kick video'}
            </p>
            <p className="video-dropzone__hint">
              or <span className="video-dropzone__browse">browse files</span>
            </p>
          </>
        )}

        <p className="video-dropzone__formats">MP4, MOV · Max 50MB</p>
      </div>

      {validationError && (
        <p className="video-dropzone__error" role="alert">
          {validationError}
        </p>
      )}
    </div>
  )
}
