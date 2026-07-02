"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { $isLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import {
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  LINK,
  ORDERED_LIST,
  QUOTE,
  STRIKETHROUGH,
  UNORDERED_LIST,
  HEADING,
  type Transformer,
} from "@lexical/markdown";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
  HeadingNode,
  QuoteNode,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { $findMatchingParent, $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  type EditorState,
  type ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  type LexicalEditor,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Quote as QuoteIcon,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { $createImageNode, ImageNode } from "@/components/admin/lexical-image-node";
import { MediaLibraryDialog } from "@/components/admin/media-library-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { uploadBucketImage } from "@/server/storage-actions";

const LOW_PRIORITY = 1;

// CODE transformers are excluded on purpose: we don't register code nodes.
const MARKDOWN_TRANSFORMERS: Transformer[] = [
  HEADING,
  QUOTE,
  UNORDERED_LIST,
  ORDERED_LIST,
  BOLD_ITALIC_STAR,
  BOLD_ITALIC_UNDERSCORE,
  BOLD_STAR,
  BOLD_UNDERSCORE,
  ITALIC_STAR,
  ITALIC_UNDERSCORE,
  STRIKETHROUGH,
  LINK,
];

type BlockType = "paragraph" | "h2" | "h3" | "bullet" | "number" | "quote";

function ToolbarButton({
  active,
  disabled,
  title,
  onClick,
  children,
}: {
  readonly active?: boolean;
  readonly disabled?: boolean;
  readonly title: string;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-8 items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-40",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="bg-border mx-1 h-5 w-px" />;
}

function LinkPopover({ isLink }: { readonly isLink: boolean }) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) return;
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        setUrl("");
        return;
      }
      const linkParent = $findMatchingParent(selection.anchor.getNode(), (node) => $isLinkNode(node));
      setUrl($isLinkNode(linkParent) ? linkParent.getURL() : "");
    });
  };

  const apply = () => {
    const trimmed = url.trim();
    if (trimmed) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
        url: trimmed,
        rel: "noopener noreferrer",
        target: "_blank",
      });
    }
    setOpen(false);
  };

  const remove = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Lenke"
          aria-label="Lenke"
          onMouseDown={(event) => event.preventDefault()}
          className={cn(
            "text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-8 items-center justify-center rounded-md transition-colors",
            isLink && "bg-muted text-foreground",
          )}
        >
          <Link2 className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="flex flex-col gap-2">
          <Input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://…"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                apply();
              }
            }}
          />
          <div className="flex justify-end gap-2">
            {isLink && (
              <Button type="button" variant="ghost" size="sm" onClick={remove}>
                Fjern lenke
              </Button>
            )}
            <Button type="button" size="sm" onClick={apply} disabled={!url.trim()}>
              Bruk
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ImageMenu() {
  const [editor] = useLexicalComposerContext();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [isUploading, startUpload] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const insertImage = useCallback(
    (url: string) => {
      editor.update(() => {
        $insertNodes([$createImageNode(url, "")]);
      });
      editor.focus();
    },
    [editor],
  );

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
      insertImage(result.url);
      toast.success("Bildet er lastet opp.");
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="Sett inn bilde"
            aria-label="Sett inn bilde"
            onMouseDown={(event) => event.preventDefault()}
            className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-8 items-center justify-center rounded-md transition-colors"
          >
            {isUploading ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => setLibraryOpen(true)}>
            <ImageIcon className="size-4" />
            Velg fra bibliotek
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
            <Upload className="size-4" />
            Last opp ny
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFileSelected} />

      <MediaLibraryDialog open={libraryOpen} onOpenChange={setLibraryOpen} onSelect={insertImage} />
    </>
  );
}

function Toolbar() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [blockType, setBlockType] = useState<BlockType>("paragraph");
  const [alignment, setAlignment] = useState<ElementFormatType>("left");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return;

    setIsBold(selection.hasFormat("bold"));
    setIsItalic(selection.hasFormat("italic"));
    setIsUnderline(selection.hasFormat("underline"));
    setIsStrikethrough(selection.hasFormat("strikethrough"));

    const anchorNode = selection.anchor.getNode();
    const element =
      anchorNode.getKey() === "root" ? anchorNode : (anchorNode.getTopLevelElement() ?? anchorNode);

    const linkParent = $findMatchingParent(anchorNode, (node) => $isLinkNode(node));
    setIsLink(linkParent !== null);

    setAlignment($isElementNode(element) ? element.getFormatType() || "left" : "left");

    const listNode = $getNearestNodeOfType(anchorNode, ListNode);
    if (listNode && $isListNode(listNode)) {
      setBlockType(listNode.getListType() === "number" ? "number" : "bullet");
      return;
    }
    if ($isHeadingNode(element)) {
      setBlockType(element.getTag() === "h3" ? "h3" : "h2");
      return;
    }
    if ($isQuoteNode(element)) {
      setBlockType("quote");
      return;
    }
    setBlockType("paragraph");
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(updateToolbar);
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        LOW_PRIORITY,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LOW_PRIORITY,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LOW_PRIORITY,
      ),
    );
  }, [editor, updateToolbar]);

  const toggleHeading = (tag: "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const isActive = blockType === tag;
      $setBlocksType(selection, () => (isActive ? $createParagraphNode() : $createHeadingNode(tag)));
    });
  };

  const toggleQuote = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      const isActive = blockType === "quote";
      $setBlocksType(selection, () => (isActive ? $createParagraphNode() : $createQuoteNode()));
    });
  };

  const toggleBulletList = () => {
    editor.dispatchCommand(blockType === "bullet" ? REMOVE_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  const toggleOrderedList = () => {
    editor.dispatchCommand(blockType === "number" ? REMOVE_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND, undefined);
  };

  const setAlign = (format: ElementFormatType) => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment === format ? "left" : format);
  };

  const clearFormatting = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      for (const node of selection.getNodes()) {
        if ($isTextNode(node)) {
          node.setFormat(0);
          node.setStyle("");
        }
      }
    });
  };

  return (
    <div className="border-input flex flex-wrap items-center gap-0.5 border-b p-1">
      <ToolbarButton
        title="Fet"
        active={isBold}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Kursiv"
        active={isItalic}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Understreking"
        active={isUnderline}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
      >
        <Underline className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        title="Gjennomstreking"
        active={isStrikethrough}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton title="Overskrift 2" active={blockType === "h2"} onClick={() => toggleHeading("h2")}>
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Overskrift 3" active={blockType === "h3"} onClick={() => toggleHeading("h3")}>
        <Heading3 className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Sitat" active={blockType === "quote"} onClick={toggleQuote}>
        <QuoteIcon className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Punktliste" active={blockType === "bullet"} onClick={toggleBulletList}>
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Nummerert liste" active={blockType === "number"} onClick={toggleOrderedList}>
        <ListOrdered className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton title="Venstrejuster" active={alignment === "left"} onClick={() => setAlign("left")}>
        <AlignLeft className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Midtstill" active={alignment === "center"} onClick={() => setAlign("center")}>
        <AlignCenter className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Høyrejuster" active={alignment === "right"} onClick={() => setAlign("right")}>
        <AlignRight className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <LinkPopover isLink={isLink} />
      <ImageMenu />
      <ToolbarButton title="Fjern formatering" onClick={clearFormatting}>
        <Eraser className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton title="Angre" disabled={!canUndo} onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}>
        <Undo2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton title="Gjør om" disabled={!canRedo} onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}>
        <Redo2 className="size-4" />
      </ToolbarButton>
    </div>
  );
}

function HtmlExportPlugin({ onChange }: { readonly onChange: (html: string) => void }) {
  const [editor] = useLexicalComposerContext();

  const handleChange = useCallback(
    (editorState: EditorState) => {
      editorState.read(
        () => {
          const root = $getRoot();
          const firstChild = root.getFirstChild();
          // Empty means a single element (paragraph) with no children at all;
          // an image-only document must not be treated as empty.
          const isEmpty =
            root.getChildrenSize() === 1 &&
            firstChild !== null &&
            $isElementNode(firstChild) &&
            firstChild.getChildrenSize() === 0;
          onChange(isEmpty ? "" : $generateHtmlFromNodes(editor, null));
        },
        { editor },
      );
    },
    [editor, onChange],
  );

  return <OnChangePlugin onChange={handleChange} />;
}

function initialEditorState(html: string) {
  return (editor: LexicalEditor) => {
    const root = $getRoot();
    if (root.getFirstChild() !== null) return;
    if (!html.trim()) {
      root.append($createParagraphNode());
      return;
    }
    const dom = new DOMParser().parseFromString(html, "text/html");
    const nodes = $generateNodesFromDOM(editor, dom);
    root.select();
    $insertNodes(nodes);
  };
}

export function RichTextEditor({
  name,
  defaultValue = "",
}: {
  readonly name: string;
  readonly defaultValue?: string;
}) {
  const [html, setHtml] = useState(defaultValue);
  // Lexical needs DOMParser to import the initial HTML, which does not exist
  // during SSR. Render a skeleton on the server and mount the editor on the
  // client only, so server and client markup match (no hydration mismatch).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="border-input rounded-md border bg-transparent shadow-xs">
        <div className="border-input h-10 border-b" />
        <div className="min-h-[220px] px-3 py-2.5" />
        <input type="hidden" name={name} value={html} />
      </div>
    );
  }

  return (
    <div className="border-input focus-within:border-ring focus-within:ring-ring/50 rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] focus-within:ring-[3px]">
      <LexicalComposer
        initialConfig={{
          namespace: "content-editor",
          editorState: initialEditorState(defaultValue),
          nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, ImageNode],
          theme: {
            text: {
              bold: "font-semibold",
              italic: "italic",
              underline: "underline",
              strikethrough: "line-through",
              underlineStrikethrough: "underline line-through",
            },
          },
          onError(error) {
            throw error;
          },
        }}
      >
        <Toolbar />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="prose-editor min-h-[220px] w-full px-3 py-2.5 focus:outline-none" />
            }
            placeholder={
              <p className="text-muted-foreground pointer-events-none absolute top-2.5 left-3 select-none">
                Skriv innhold …
              </p>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />
        <HtmlExportPlugin onChange={setHtml} />
      </LexicalComposer>
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
