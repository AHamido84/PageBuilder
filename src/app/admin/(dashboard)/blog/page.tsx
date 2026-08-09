import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { TaxonomyManager } from "./taxonomy-manager";
import { CreatePostForm } from "./create-post-form";
import { PostRowActions } from "./post-row-actions";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "blog", "read");

  const [posts, categories, tags, users] = await Promise.all([
    prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true, author: { select: { name: true } } },
    }),
    prisma.blogCategory.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.tag.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const canCreate = currentUser.permissions.has("blog:create");
  const canDelete = currentUser.permissions.has("blog:delete");

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Blog</h1>

      <TaxonomyManager categories={categories} tags={tags} />

      {canCreate ? (
        <div className="mb-6 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="mb-3 text-sm font-medium">New post</h2>
          <CreatePostForm
            categories={categories.map((c) => ({ id: c.id, label: c.nameEn }))}
            tags={tags.map((t) => ({ id: t.id, label: t.nameEn }))}
            authors={users.map((u) => ({ id: u.id, label: u.name }))}
          />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-left text-neutral-400">
            <tr>
              <th className="px-4 py-2">Title (EN)</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Author</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Published</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => {
              const scheduled = post.status === "PUBLISHED" && post.publishedAt && post.publishedAt > new Date();
              return (
                <tr key={post.id} className="border-t border-neutral-800">
                  <td className="px-4 py-2">
                    <Link href={`/admin/blog/${post.id}`} className="hover:underline">
                      {post.titleEn}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-neutral-400">{post.category?.nameEn ?? "—"}</td>
                  <td className="px-4 py-2 text-neutral-400">{post.author?.name ?? "—"}</td>
                  <td className="px-4 py-2">{scheduled ? "Scheduled" : post.status}</td>
                  <td className="px-4 py-2 text-neutral-500">{post.publishedAt ? post.publishedAt.toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <PostRowActions postId={post.id} canDelete={canDelete} />
                  </td>
                </tr>
              );
            })}
            {posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-500">
                  No posts yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
