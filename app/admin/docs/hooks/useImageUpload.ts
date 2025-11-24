import { useCallback } from "react"
import { JSONContent } from "@tiptap/core"
import { supabase } from "@/lib/supabaseClient"

export type TempImage = {
  id: string
  file: File
}

type ImageNode = JSONContent & {
  attrs?: Record<string, unknown> & {
    src?: string
    alt?: string
    ["data-temp-id"]?: string
  }
}

export function useImageUpload(bucket = "doc-images") {
  const uploadAndPatchContent = useCallback(
    async (
      content: JSONContent | null,
      images: TempImage[],
      slugForName: string
    ): Promise<JSONContent | null> => {
      if (!content || images.length === 0) return content

      const findFile = (id: string) => images.find((img) => img.id === id)?.file

      const uploadFile = async (file: File, tempId: string) => {
        const ext = file.name.split(".").pop() || "png"
        const fileName = `${slugForName}-${tempId}.${ext}`
        const { data: uploadData, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, { upsert: true })

        if (error) {
          throw new Error(error.message)
        }

        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(uploadData.path)

        return publicUrlData.publicUrl
      }

      const walk = async (node: ImageNode): Promise<JSONContent> => {
        const nextNode: ImageNode = { ...node }

        if (nextNode.type === "image" && nextNode.attrs?.["data-temp-id"]) {
          const tempId = nextNode.attrs["data-temp-id"]
          const file = typeof tempId === "string" ? findFile(tempId) : null

          if (file) {
            const src = await uploadFile(file, tempId as string)
            nextNode.attrs = { ...nextNode.attrs, src }
            delete nextNode.attrs["data-temp-id"]
          }
        }

        if (Array.isArray(nextNode.content)) {
          nextNode.content = await Promise.all(
            nextNode.content.map((child) => walk(child as ImageNode))
          )
        }

        return nextNode
      }

      return walk(content as ImageNode)
    },
    [bucket]
  )

  return { uploadAndPatchContent }
}
