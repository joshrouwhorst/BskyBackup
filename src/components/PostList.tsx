"use client";

import React from "react";
import type { PostData } from "@/types/bsky";
import type { DraftPost } from "@/types/drafts";
import Post from "@/components/Post";

interface PostListProps {
  context: () => {
    posts?: PostData[];
    drafts?: DraftPost[];
    isLoading: boolean;
  };
  children?: React.ReactNode;
}

export default function PostList({ children, context }: PostListProps) {
  const { posts, drafts, isLoading } = context();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading posts...</span>
      </div>
    );
  }

  if (
    (!posts || posts.length === 0) &&
    (!drafts || drafts.length === 0) &&
    children
  ) {
    return <div>{children}</div>;
  } else if (
    (!posts || posts.length === 0) &&
    (!drafts || drafts.length === 0)
  ) {
    return <div>No posts</div>;
  }

  return (
    <div className="relative">
      <ul className="flex flex-col items-center">
        {posts?.map((post) => (
          <li key={post.post.cid} className="w-full max-w-2xl mb-4">
            <Post postData={post} />
          </li>
        ))}
        {drafts?.map((draft) => (
          <li key={draft.meta?.id} className="w-full max-w-2xl mb-4">
            <Post draftPost={draft} />
          </li>
        ))}
      </ul>
    </div>
  );
}
