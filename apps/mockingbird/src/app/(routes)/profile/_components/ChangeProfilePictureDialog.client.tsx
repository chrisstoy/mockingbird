'use client';

import { getImagesForUser, getOrCreateAlbum, uploadImage } from '@/_apiServices/images';
import { updateUserImage } from '@/_apiServices/users';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { type Image, type ImageId } from '@/_types';
import {
  ArrowUpTrayIcon,
  CameraIcon,
  CheckIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { useCallback, useEffect, useRef, useState } from 'react';

type Tab = 'upload' | 'library' | 'camera';

interface Props {
  currentImageSrc: string;
  onClosed: (newImageUrl?: string) => void;
}

// ── Library tab ───────────────────────────────────────────────────────────────

function LibraryTab({ onImagePicked }: { onImagePicked: (image: Image) => void }) {
  const user = useSessionUser();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ImageId>();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const imgs = await getImagesForUser(user.id);
      setImages(imgs);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 p-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton aspect-square rounded-xl" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-base-200 flex items-center justify-center">
          <PhotoIcon className="w-6 h-6 text-base-content/30" />
        </div>
        <div>
          <p className="font-semibold text-sm text-base-content">No images yet</p>
          <p className="text-xs text-base-content/50 mt-1">
            Upload a photo first, then select it from your library.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-56">
        {images.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => { setSelected(img.id); onImagePicked(img); }}
            className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
              selected === img.id
                ? 'border-primary scale-95'
                : 'border-transparent hover:border-base-300'
            }`}
          >
            <img src={img.thumbnailUrl} alt="library image" className="w-full h-full object-cover" />
            {selected === img.id && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <CheckIconSolid className="w-5 h-5 text-primary" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Camera tab ────────────────────────────────────────────────────────────────

function CameraTab({ onCapture }: { onCapture: (file: File) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch {
        setError('Camera access denied or unavailable.');
      }
    })();

    return () => {
      setStream((s) => { s?.getTracks().forEach((t) => t.stop()); return null; });
    };
  }, []);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCaptured(dataUrl);
    canvas.toBlob((blob) => {
      if (blob) onCapture(new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
  }, [onCapture]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center">
          <CameraIcon className="w-6 h-6 text-error/50" />
        </div>
        <p className="text-xs text-base-content/60">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <canvas ref={canvasRef} className="hidden" />
      {captured ? (
        <>
          <img src={captured} alt="captured" className="rounded-xl w-full max-h-48 object-cover" />
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={() => setCaptured(null)}
              className="btn btn-outline btn-sm flex-1"
            >
              Retake
            </button>
            <div className="flex-1 flex items-center justify-center text-xs text-success font-semibold gap-1">
              <CheckIcon className="w-4 h-4" /> Photo ready
            </div>
          </div>
        </>
      ) : (
        <>
          <video ref={videoRef} autoPlay playsInline muted className="rounded-xl w-full max-h-48 object-cover bg-base-200" />
          <button type="button" onClick={handleCapture} className="btn btn-primary btn-circle w-12 h-12">
            <CameraIcon className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}

// ── Main dialog ───────────────────────────────────────────────────────────────

export function ChangeProfilePictureDialog({ currentImageSrc, onClosed }: Props) {
  const user = useSessionUser();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingLibraryImage, setPendingLibraryImage] = useState<Image | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dialogRef.current?.showModal();
    return () => dialogRef.current?.close();
  }, []);

  useEffect(() => {
    return () => { if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleFileSelected = useCallback((file: File) => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPendingLibraryImage(null);
    setPreviewUrl(URL.createObjectURL(file));
  }, [previewUrl]);

  const handleLibraryPick = useCallback((image: Image) => {
    setPendingLibraryImage(image);
    setPendingFile(null);
    setPreviewUrl(image.thumbnailUrl);
  }, []);

  const handleCameraCapture = useCallback((file: File) => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPendingLibraryImage(null);
    setPreviewUrl(URL.createObjectURL(file));
  }, [previewUrl]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      let imageUrl: string;
      if (pendingFile) {
        const album = await getOrCreateAlbum(user.id, 'Profile Pictures');
        const uploaded = await uploadImage(user.id, pendingFile, { albumId: album.id });
        imageUrl = uploaded.imageUrl;
      } else if (pendingLibraryImage) {
        imageUrl = pendingLibraryImage.imageUrl;
      } else {
        return;
      }
      await updateUserImage(user.id, imageUrl);
      onClosed(imageUrl);
    } catch (err) {
      console.error('Failed to update profile picture', err);
    } finally {
      setSaving(false);
    }
  }, [user, pendingFile, pendingLibraryImage, onClosed]);

  const hasPending = !!(pendingFile || pendingLibraryImage);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'upload', label: 'Upload', icon: <ArrowUpTrayIcon className="w-4 h-4" /> },
    { id: 'library', label: 'My Library', icon: <PhotoIcon className="w-4 h-4" /> },
    { id: 'camera', label: 'Camera', icon: <CameraIcon className="w-4 h-4" /> },
  ];

  return (
    <dialog
      ref={dialogRef}
      className="m-auto bg-transparent open:animate-fade-in open:backdrop:animate-fade-in backdrop:backdrop-blur-sm backdrop:bg-black/40"
    >
      <div className="w-88 rounded-2xl border border-base-200 shadow-2xl bg-base-100 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-200">
          <h2 className="font-bold text-base text-base-content leading-none">
            Change profile picture
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => onClosed()}
            className="w-7 h-7 rounded-full flex items-center justify-center text-base-content/40 hover:text-base-content hover:bg-base-200 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Preview avatar */}
        <div className="flex justify-center pt-5 pb-3 bg-base-100">
          <div className="relative w-24 h-24">
            <img
              src={previewUrl ?? currentImageSrc}
              alt="Profile preview"
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white shadow-md"
            />
            {previewUrl && (
              <div className="absolute -bottom-1 -right-1 bg-success rounded-full p-1 shadow ring-2 ring-white">
                <CheckIconSolid className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Pill tabs — matches FeedSelector style */}
        <div className="px-4 pb-3">
          <div className="flex gap-1 bg-base-200 rounded-xl p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-base-content shadow-sm'
                    : 'text-base-content/50 hover:text-base-content'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab panels */}
        <div className="bg-base-100 min-h-40">
          {activeTab === 'upload' && (
            <div className="flex flex-col items-center gap-3 p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelected(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-outline w-full gap-2"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                Choose file from device
              </button>
              {pendingFile && (
                <p className="text-xs text-base-content/50 truncate max-w-full">
                  {pendingFile.name}
                </p>
              )}
            </div>
          )}
          {activeTab === 'library' && <LibraryTab onImagePicked={handleLibraryPick} />}
          {activeTab === 'camera' && <CameraTab onCapture={handleCameraCapture} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-base-200">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onClosed()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!hasPending || saving}
            onClick={handleSave}
          >
            {saving ? <span className="loading loading-spinner loading-xs" /> : null}
            Save
          </button>
        </div>
      </div>
    </dialog>
  );
}
