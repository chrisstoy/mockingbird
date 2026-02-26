'use client';

import { getImagesForUser, getOrCreateAlbum, uploadImage } from '@/_apiServices/images';
import { updateUserImage } from '@/_apiServices/users';
import { useSessionUser } from '@/_hooks/useSessionUser';
import { type Image, type ImageId } from '@/_types';
import {
  CameraIcon,
  ArrowUpTrayIcon,
  PhotoIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/solid';
import { useCallback, useEffect, useRef, useState } from 'react';

type Tab = 'upload' | 'library' | 'camera';

interface Props {
  currentImageSrc: string;
  onClosed: (newImageUrl?: string) => void;
}

// ── Library tab ──────────────────────────────────────────────────────────────

function LibraryTab({
  onImagePicked,
}: {
  onImagePicked: (image: Image) => void;
}) {
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
          <div key={i} className="skeleton aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="rounded-full bg-base-200 p-5">
          <PhotoIcon className="w-10 h-10 opacity-30" />
        </div>
        <div>
          <p className="font-semibold text-base-content">No images yet</p>
          <p className="text-sm text-base-content/50 mt-1">
            Upload a photo first, then select it from your library.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-64">
        {images.map((img) => (
          <button
            key={img.id}
            type="button"
            onClick={() => {
              setSelected(img.id);
              onImagePicked(img);
            }}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
              selected === img.id
                ? 'border-primary scale-95'
                : 'border-transparent hover:border-base-content/30'
            }`}
          >
            <img
              src={img.thumbnailUrl}
              alt="library image"
              className="w-full h-full object-cover"
            />
            {selected === img.id && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <CheckIcon className="w-6 h-6 text-primary" />
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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch {
        setError('Camera access denied or unavailable.');
      }
    })();

    return () => {
      setStream((s) => {
        s?.getTracks().forEach((t) => t.stop());
        return null;
      });
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
      if (blob) {
        onCapture(new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' }));
      }
    }, 'image/jpeg', 0.9);
  }, [onCapture]);

  const handleRetake = useCallback(() => {
    setCaptured(null);
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center px-4">
        <div className="rounded-full bg-error/10 p-5">
          <CameraIcon className="w-10 h-10 text-error/50" />
        </div>
        <p className="text-sm text-base-content/60">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <canvas ref={canvasRef} className="hidden" />
      {captured ? (
        <>
          <img
            src={captured}
            alt="captured"
            className="rounded-xl w-full max-h-56 object-cover"
          />
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={handleRetake}
              className="btn btn-outline btn-sm flex-1"
            >
              Retake
            </button>
            <div className="flex-1 flex items-center justify-center text-sm text-success font-medium gap-1">
              <CheckIcon className="w-4 h-4" />
              Photo ready
            </div>
          </div>
        </>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="rounded-xl w-full max-h-56 object-cover bg-base-300"
          />
          <button
            type="button"
            onClick={handleCapture}
            className="btn btn-primary btn-circle w-14 h-14"
          >
            <CameraIcon className="w-6 h-6" />
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

  // cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelected = useCallback(
    (file: File) => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      setPendingFile(file);
      setPendingLibraryImage(null);
      setPreviewUrl(URL.createObjectURL(file));
    },
    [previewUrl]
  );

  const handleLibraryPick = useCallback((image: Image) => {
    setPendingLibraryImage(image);
    setPendingFile(null);
    setPreviewUrl(image.thumbnailUrl);
  }, []);

  const handleCameraCapture = useCallback(
    (file: File) => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      setPendingFile(file);
      setPendingLibraryImage(null);
      setPreviewUrl(URL.createObjectURL(file));
    },
    [previewUrl]
  );

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      let imageUrl: string;

      if (pendingFile) {
        const album = await getOrCreateAlbum(user.id, 'Profile Pictures');
        const uploaded = await uploadImage(user.id, pendingFile, {
          albumId: album.id,
        });
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
    {
      id: 'upload',
      label: 'Upload',
      icon: <ArrowUpTrayIcon className="w-4 h-4" />,
    },
    {
      id: 'library',
      label: 'My Library',
      icon: <PhotoIcon className="w-4 h-4" />,
    },
    {
      id: 'camera',
      label: 'Camera',
      icon: <CameraIcon className="w-4 h-4" />,
    },
  ];

  return (
    <dialog
      ref={dialogRef}
      className="m-auto bg-transparent open:animate-fade-in open:backdrop:animate-fade-in"
    >
      <div className="card card-bordered shadow-xl bg-base-100 w-[22rem]">
        {/* Header */}
        <div className="flex-none rounded-t-2xl bg-primary text-primary-content px-5 py-4 flex items-center justify-between">
          <span className="font-bold text-xl">Change profile picture</span>
          <button
            type="button"
            className="w-5 shrink-0"
            onClick={() => onClosed()}
          >
            <XMarkIcon />
          </button>
        </div>

        {/* Current / preview avatar */}
        <div className="flex justify-center pt-5 pb-2 bg-base-100">
          <div className="relative w-28 h-28">
            <img
              src={previewUrl ?? currentImageSrc}
              alt="Profile preview"
              className="w-28 h-28 rounded-full object-cover border-4 border-base-300 shadow-md"
            />
            {previewUrl && (
              <div className="absolute bottom-1 right-1 bg-success rounded-full p-1 shadow">
                <CheckIcon className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div role="tablist" className="tabs tabs-bordered px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              className={`tab gap-1.5 ${activeTab === tab.id ? 'tab-active font-semibold' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="bg-base-100 min-h-40">
          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center gap-4 p-6">
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
                <ArrowUpTrayIcon className="w-5 h-5" />
                Choose file from device
              </button>
              {pendingFile && activeTab === 'upload' && (
                <p className="text-sm text-base-content/60 truncate max-w-full">
                  {pendingFile.name}
                </p>
              )}
            </div>
          )}

          {activeTab === 'library' && (
            <LibraryTab onImagePicked={handleLibraryPick} />
          )}

          {activeTab === 'camera' && (
            <CameraTab onCapture={handleCameraCapture} />
          )}
        </div>

        {/* Footer actions */}
        <div className="flex-none flex rounded-b-2xl bg-primary text-primary-content justify-end p-2 gap-1">
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => onClosed()}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            disabled={!hasPending || saving}
            onClick={handleSave}
          >
            {saving ? (
              <span className="loading loading-spinner loading-xs" />
            ) : null}
            Save
          </button>
        </div>
      </div>
    </dialog>
  );
}
