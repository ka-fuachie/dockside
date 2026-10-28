import { FieldDescription, FieldError, FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { callEventHandler } from "@/lib/event";
import { CloudUploadIcon, LoaderCircleIcon } from "@lucide/solid";
import { ComponentProps } from "@solidjs/web";
import { createSignal, For, omit, Show } from "solid-js";

type DropzoneProps = {
  onDropFiles?: (error: any, fileList: FileList | null, type: "file" | "folder" | null) => void
  disabled?: boolean
}

function Dropzone(props: ComponentProps<"div"> & DropzoneProps) {
  const otherProps = omit(props, "children", "onDragOver", "onDragLeave", "onDrop", "onDropFiles", "disabled")
  const [hovered, setHovered] = createSignal(false)

  function isFileEntry(entry: FileSystemEntry): entry is FileSystemFileEntry {
    return entry.isFile;
  }

  function isDirectoryEntry(entry: FileSystemEntry): entry is FileSystemDirectoryEntry {
    return entry.isDirectory;
  }

  async function traverseEntry(files: File[], entry: FileSystemEntry, path: string) {
    if (isFileEntry(entry)) {
      await new Promise<void>(resolve => {
        entry.file(file => {
          const relativePath = path != "" ? `${path}/${file.name}` : file.name
          Object.defineProperty(file, 'webkitRelativePath', {
            value: relativePath,
            writable: false,
            configurable: true
          });
          files.push(file)
          resolve()
        })
      })
    } else if (isDirectoryEntry(entry)) {
      const reader = entry.createReader();
      const dirPath = path != "" ? `${path}/${entry.name}` : entry.name

      const readAllEntries = async () => {
        const entries = await new Promise<FileSystemEntry[]>((resolve) => reader.readEntries(resolve));
        if (entries.length > 0) {
          const entryPromises = entries.map(childEntry => traverseEntry(files, childEntry, dirPath));
          await Promise.all(entryPromises);
          await readAllEntries();
        }
      };

      await readAllEntries();
    }

    return files
  }

  function processDroppedEntry(entry: FileSystemEntry) {
    return new Promise<{type: "file" | "folder" | null, fileList: FileList | null}>((resolve) => {
      if (isFileEntry(entry)) {
        entry.file(file => {
          const dataTransfer = new DataTransfer()
          dataTransfer.items.add(file)
          resolve({ type: "file", fileList: dataTransfer.files })
        })
      } else if (isDirectoryEntry(entry)) {
        traverseEntry([], entry, "").then(files => {
          const dataTransfer = new DataTransfer()
          for (const file of files) {
            dataTransfer.items.add(file)
          }

          resolve({type: "folder", fileList: dataTransfer.files})
        })
      } else {
        resolve({type: null, fileList: null})
      }
    })
  }

  return (
    <div
      data-hovered={String(hovered())}
      onDragOver={ev => {
        try {
          if (props.disabled) return
          ev.preventDefault()
          setHovered(true)
        } finally {
          callEventHandler(props.onDragOver, ev)
        }
      }}
      onDragLeave={ev => {
        try {
          if (props.disabled) return
          ev.preventDefault()
          setHovered(false)
        } finally {
          callEventHandler(props.onDragLeave, ev)
        }
      }}
      onDrop={ev => {
        try {
          if(props.disabled) return
          ev.preventDefault()
          setHovered(false)

          const items = ev.dataTransfer?.items ?? null
          if (items == null) return
          if(items.length == 0) return

          if (items.length > 1) {
            props.onDropFiles?.(new Error("Only drop a single folder, html or zip file"), null, null)
            return
          }

          const entry = items[0].webkitGetAsEntry()
          if(entry == null) return

          processDroppedEntry(entry).then(processed => {
            props.onDropFiles?.(null, processed.fileList, processed.type)
          })
        } finally {
          callEventHandler(props.onDrop, ev)
        }
      }}
      {...otherProps}
    >
      {props.children}
    </div>
  )
}

type DeploymentUploadProps = {
  errorMessage: string | null
  issues: Record<string, string> | null
  isSubmitting: boolean
  onChange?: () => void
}

export function DeploymentUpload(props: DeploymentUploadProps) {
  let fileInputRef: HTMLInputElement | null = null
  let folderInputRef: HTMLInputElement | null = null

  const [dropzoneError, setDropzoneError] = createSignal<any>(null)

  const errors = () => ([
    ...(props.issues == null ? [props.errorMessage] : []),
    ...(props.issues != null ? Object.values(props.issues) : []),
    dropzoneError() != null ? (dropzoneError() as Error).message: null
  ].filter(Boolean) as string[])

  return (
    <FieldSet>
      <FieldLegend class="sr-only">Deployment upload</FieldLegend>
      <FieldGroup>
        <Dropzone
          class="relative isolate w-full rounded-lg hover:bg-muted/50 border border-dashed border-muted-foreground/50 data-[hovered=true]:bg-primary/25 data-[hovered=true]:border-primary"
          onDropFiles={(error, fileList, type) => {
            if (error != null) {
              setDropzoneError(error)
              return
            }

            if (type == null || fileList == null) return
            if(fileInputRef == null || folderInputRef == null) return

            const emptyFileList = new DataTransfer().files
            if (type === "file") {
              fileInputRef.files = fileList
              folderInputRef.files = emptyFileList
            } else {
              folderInputRef.files = fileList
              fileInputRef.files = emptyFileList
            }

            props.onChange?.()
            setDropzoneError(null)
          }}
        >
          <div class="grid justify-items-center gap-2 px-4 sm:px-8 py-8 sm:py-14 text-muted-foreground">
            <CloudUploadIcon class="sm:size-8" />
            <p>Drop a folder, zip file, or a single HTML file here to deploy</p>
            <div class="text-sm">
              <span>Or </span>
              <span class="catch-focus">
                <label
                  for="file"
                  class="underline underline-offset-4 hover:text-foreground cursor-pointer"
                >
                  <span aria-hidden="true">browse files to upload</span>
                  <span class="sr-only">Choose a file</span>
                  <span class="absolute inset-0 rounded-lg z-10" />
                </label>
                <input
                  id="file"
                  name="file"
                  type="file"
                  class="sr-only"
                  accept=".zip,.html"
                  onChange={() => {
                    if (folderInputRef != null) {
                      folderInputRef.files = new DataTransfer().files
                    }
                    props.onChange?.()
                    setDropzoneError(null)
                  }}
                  ref={node => fileInputRef = node}
                />
              </span>
              <span> or </span>
              <span class="catch-focus" >
                <label
                  for="folder"
                  class="relative z-100 underline underline-offset-4 hover:text-foreground cursor-pointer"
                >
                  <span aria-hidden="true">choose a folder</span>
                  <span class="sr-only">Choose a folder</span>
                </label>
                <input
                  id="folder"
                  name="folder"
                  type="file"
                  class="sr-only"
                  webkitdirectory multiple
                  onChange={() => {
                    if (fileInputRef != null) {
                      fileInputRef.files = new DataTransfer().files
                    }
                    props.onChange?.()
                    setDropzoneError(null)
                  }}
                  ref={node => folderInputRef = node}
                />
              </span>
            </div>
          </div>
        </Dropzone>

        <Show when={props.isSubmitting}>
          <FieldDescription class="flex items-center gap-1">
            <LoaderCircleIcon class="size-4 animate-spin" />
            <span>Uploading</span>
          </FieldDescription>
        </Show>

        <div>
          <For each={errors()}>
            {(item) => <FieldError>{item}</FieldError>}
          </For>
        </div>
      </FieldGroup>
    </FieldSet>
  )
}
