import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, assertCan } from "@/lib/rbac/current-user";
import { Tabs } from "@/components/admin/ui/tabs";
import { SeoForm } from "@/components/admin/ui/seo-form";
import { EditPostForm } from "./edit-post-form";
import { updateBlogPostSeoAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  assertCan(currentUser, "blog", "update");

  const [post, categories, tags, users] = await Promise.all([
    prisma.blogPost.findUnique({
      where: { id },
      include: { coverImage: { select: { url: true } }, tags: { select: { id: true } }, seo: true },
    }),
    prisma.blogCategory.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.tag.findMany({ orderBy: { nameEn: "asc" } }),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!post) notFound();

  const categoryOptions = categories.map((c) => ({ id: c.id, label: c.nameEn }));
  const tagOptions = tags.map((t) => ({ id: t.id, label: t.nameEn }));
  const authorOptions = users.map((u) => ({ id: u.id, label: u.name }));

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold">Edit post</h1>
      <Tabs
        items={[
          {
            key: "details",
            label: "Details",
            content: <EditPostForm post={post} categories={categoryOptions} tags={tagOptions} authors={authorOptions} />,
          },
          {
            key: "seo",
            label: "SEO",
            content: (
              <SeoForm action={updateBlogPostSeoAction} idFieldName="blogPostId" entityId={post.id} defaultValues={post.seo ?? {}} />
            ),
          },
        ]}
      />
    </div>
  );
}
