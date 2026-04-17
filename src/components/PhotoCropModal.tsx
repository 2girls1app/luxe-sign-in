import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut } from "lucide-react";

interface PhotoCropModalProps {
  open: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onSave: (croppedBlob: Blob) => void | Promise<void>;
  saving?: boolean;
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  const size = Math.min(pixelCrop.width, pixelCrop.height);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not generate image"))),
      "image/jpeg",
      0.92
    );
  });
}

const PhotoCropModal = ({ open, imageSrc, onClose, onSave, saving }: PhotoCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
    await onSave(blob);
  };

  const handleClose = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-card border-border">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="text-foreground">Adjust your photo</DialogTitle>
        </DialogHeader>

        <div className="relative w-full h-72 bg-black mt-3">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Drag to reposition · Zoom to adjust</p>
            <div className="flex items-center gap-3">
              <ZoomOut size={16} className="text-muted-foreground shrink-0" />
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.05}
                onValueChange={(v) => setZoom(v[0])}
                className="flex-1"
              />
              <ZoomIn size={16} className="text-primary shrink-0" />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleClose}
              disabled={saving}
              className="flex-1 rounded-lg border border-border bg-secondary text-foreground py-2.5 text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !croppedAreaPixels}
              className="flex-1 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Photo"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhotoCropModal;
