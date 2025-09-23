// TODO: Implement delete functionality for uploaded files

'use client'

import { useEffect, useState } from 'react'
import { Button, Textarea, Input, Label } from '@/components/ui/forms'
import { X, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Buffer } from 'buffer'
import { useDrafts } from '@/hooks/useDrafts'
import Image from 'next/image'

interface CreateDraftFormProps {
  redirect?: string
  draftId?: string
}

export function CreateDraftForm({ redirect, draftId }: CreateDraftFormProps) {
  const { getDraft, createDraft, updateDraft } = useDrafts()
  const [text, setText] = useState('')
  const [filesToUpload, setFilesToUpload] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [group, setGroup] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchDraft = async () => {
      if (!draftId) return
      // Fetch draft data and populate form
      const draft = await getDraft(draftId)
      if (draft) {
        setText(draft.meta.text || '')
        setFilesToUpload([])
        setUploadedFiles(
          draft.meta.images
            ?.filter((image) => image.url)
            .map((image) => image.url)
            .filter((url): url is string => typeof url === 'string') || []
        )
        setGroup(draft.group || '')
      }
    }
    fetchDraft()
  }, [draftId, getDraft])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFilesToUpload((prev) => [...prev, ...selectedFiles].slice(0, 4))
  }

  const removeFile = (index: number) => {
    setFilesToUpload((prev) => prev.filter((_, i) => i !== index))
  }

  const convertFileToBuffer = async (file: File): Promise<Buffer> => {
    const arrayBuffer = await file.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const images = []
    let video = null

    for (const file of filesToUpload) {
      const data = await convertFileToBuffer(file)

      if (file.type.startsWith('image/')) {
        images.push({
          kind: 'image' as const,
          filename: file.name,
          mime: file.type,
          data,
        })
      } else if (file.type.startsWith('video/')) {
        video = {
          kind: 'video' as const,
          filename: file.name,
          mime: file.type,
          data,
        }
        break // Only one video allowed
      }
    }

    const submitData = {
      text: text || undefined,
      images: images.length > 0 ? images : undefined,
      video: video || undefined,
      group: group || undefined,
    }
    if (draftId) {
      await updateDraft(draftId, submitData)
    } else {
      // Creating new draft
      await createDraft(submitData)
    }

    setText('')
    setFilesToUpload([])
    setGroup('')

    if (redirect) {
      router.push(redirect)
    }
  }

  const handleCancel = () => {
    if (redirect) {
      router.push(redirect)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <div>
        <Label htmlFor="text">Post Text</Label>
        <Textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's happening?"
          className="min-h-[100px]"
        />
      </div>

      <div>
        <Label htmlFor="group">Group (optional)</Label>
        <Input
          id="group"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          placeholder="e.g., drafts, scheduled, etc."
        />
      </div>

      <div>
        <Label htmlFor="media">Media (up to 4 images or 1 video)</Label>
        <Input
          id="media"
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileUpload}
          disabled={filesToUpload.length >= 4}
        />
      </div>

      <UploadedFilesOutput files={uploadedFiles} />

      {filesToUpload.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {filesToUpload.map((file, index) => (
            <div key={index} className="relative">
              <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <video
                    src={URL.createObjectURL(file)}
                    className="w-16 h-16 object-cover rounded"
                    muted
                  />
                )}
                <span className="text-sm truncate">{file.name}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="ml-auto"
                >
                  <X size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit">
          {draftId ? 'Update Draft' : 'Create Draft'}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function UploadedFilesOutput({ files }: { files: string[] }) {
  if (files.length === 0) return null
  return (
    <div className="mt-2">
      <Label>Uploaded Files:</Label>
      <ul className="m-0 p-0 list-none grid grid-cols-4 gap-2">
        {files.map((file, index) => (
          <li key={index} className="relative aspect-square group">
            <Image
              src={file}
              alt={'Photograph'}
              fill
              className="object-cover rounded"
            />
            <Button
              type="button"
              variant="icon"
              title="Open in new tab"
              onClick={() => window.open(file, '_blank', 'noopener,noreferrer')}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
              tabIndex={-1}
            >
              <ExternalLink size={16} />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
