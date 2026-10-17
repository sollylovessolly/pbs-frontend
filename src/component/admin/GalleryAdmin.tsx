import Link from "next/link";
import { galleryAlbums } from "@/lib/gallery/albums";
import { PageHeader, Panel } from "./primitives";
export default function GalleryAdmin({ id }: { id?: string }) {
  return (
    <>
      <PageHeader
        title="Gallery"
        description="Your public albums are managed in the frontend repository."
      />
      <Panel title="Add photos through your code">
        <p>
          Place photos in public/images/gallery, then run npm run
          gallery:generate and push your changes to deploy.
        </p>
        <p className="mt-3">
          Product Showcase filenames beginning with vintage-letters-,
          polaroids-, photostrips-, phone-cases- or albums- also appear in the
          matching product mini gallery.
        </p>
        <p className="mt-3">
          Gallery uploads here have been replaced by repo-managed photos, so
          they do not use backend file storage.
        </p>
        {id && <p className="mt-3">Edit album content in the repository.</p>}
        <ul className="mt-5 space-y-3">
          {galleryAlbums.map((album) => (
            <li key={album.id}>
              <Link
                href={`/gallery/${album.slug}`}
                className="font-bold underline"
              >
                {album.title}
              </Link>{" "}
              · {album.photoCount} photos{" "}
              <code className="block text-sm">
                public/images/gallery/{album.slug}/
              </code>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
