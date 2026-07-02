"use client";

import { useRef, useState, useTransition } from "react";

import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { MediaLibraryDialog } from "@/components/admin/media-library-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadBucketImage } from "@/server/storage-actions";

export function ImagePicker({
  name,
  defaultValue = "",
}: {
  readonly name: string;
  readonly defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [isUploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    startUpload(async () => {
      const result = await uploadBucketImage(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setValue(result.url);
      toast.success("Bildet er lastet opp.");
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name={name} value={value} />

      <div className="flex items-start gap-3">
        <div className="bg-muted relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImageIcon className="text-muted-foreground size-6" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="https://… eller velg fra biblioteket"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
              <ImageIcon className="size-4" />
              Velg fra bibliotek
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => fileRef.current?.click()}
            >
              {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              Last opp
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setValue("")}>
                <X className="size-4" />
                Fjern
              </Button>
            )}
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFileSelected} />

      <MediaLibraryDialog open={open} onOpenChange={setOpen} onSelect={setValue} selectedUrl={value} />
    </div>
  );
}
