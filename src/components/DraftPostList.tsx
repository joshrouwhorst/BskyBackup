"use client";

import React from "react";
import PostList from "@/components/PostList";
import { useDraftContext } from "@/providers/DraftsProvider";
import { LinkButton } from "./ui/forms";
import { Plus } from "lucide-react";

export default function DraftPostList() {
  return (
    <div className="relative">
      <PostList context={useDraftContext}>
        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
          <h2 className="text-lg font-semibold mb-2">No drafts yet</h2>
          <p className="mb-4">
            Create a draft by clicking the button in the top right.
          </p>
        </div>
      </PostList>
      <LinkButton
        variant="primary"
        size="sm"
        href="/drafts/create"
        className="absolute top-0 right-0 z-10"
      >
        <Plus /> Create Draft
      </LinkButton>
    </div>
  );
}
