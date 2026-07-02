"use client";

import { useEffect, useState, useTransition } from "react";

import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteBucketImage, listBucketImages, type StoredImage } from "@/server/storage-actions";

export function MediaLibraryDialog({
  open,
  onOpenChange,
  onSelect,
  selectedUrl,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSelect: (url: string) => void;
  readonly selectedUrl?: string;
}) {
  const [images, setImages] = useState<StoredImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<StoredImage | null>(null);
  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listBucketImages()
      .then(setImages)
      .finally(() => setLoading(false));
  }, [open]);

  const confirmDelete = () => {
    if (!pendingDelete) return;

    const { name, url } = pendingDelete;
    startDelete(async () => {
      const result = await deleteBucketImage(name);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      setImages((current) => current.filter((image) => image.name !== name));
      if (selectedUrl === url) {
        onSelect("");
      }
      setPendingDelete(null);
      toast.success("Bildet er slettet.");
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bildebibliotek</DialogTitle>
            <DialogDescription>
              Velg et bilde som allerede er lastet opp, eller slett bilder du ikke lenger trenger.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="text-muted-foreground size-6 animate-spin" />
            </div>
          ) : images.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              Ingen bilder ennå. Bruk «Last opp» for å legge til.
            </p>
          ) : (
            <div className="grid max-h-[60vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
              {images.map((image) => (
                <div
                  key={image.name}
                  className={cn(
                    "group bg-muted relative aspect-square overflow-hidden rounded-md border transition-colors",
                    selectedUrl === image.url ? "border-primary ring-primary ring-2" : "hover:border-primary",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(image.url);
                      onOpenChange(false);
                    }}
                    className="size-full"
                    title={image.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt={image.name} className="size-full object-cover" />
                  </button>

                  <Button
                    type="button"
                    variant="destructive"
                    size="icon-sm"
                    className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                    aria-label={`Slett ${image.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setPendingDelete(image);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isDeleting) {
            setPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slette bildet?</AlertDialogTitle>
            <AlertDialogDescription>
              «{pendingDelete?.name}» fjernes permanent fra biblioteket. Bilder som allerede er i bruk på
              nettsiden vil få ødelagte lenker.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Sletter …" : "Slett"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
