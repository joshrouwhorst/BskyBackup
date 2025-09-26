import { EmbedView } from '@/types/bsky'
import React from 'react'

interface EmbedGifProps {
  embed?: EmbedView | undefined
}

export default function EmbedGif({ embed }: EmbedGifProps) {
  if (!embed || !embed.external || !embed.external.uri) return null

  return (
    <div className="embed-gif">
      <img src={embed.external.uri} alt={embed.external.title} />
    </div>
  )
}
