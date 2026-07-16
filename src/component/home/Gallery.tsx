import Button from "@/component/ui/Button";

const galleryItems = [
  "bg-gradient-to-br from-[#d6a98e] to-[#b97b63]",
  "bg-gradient-to-br from-rose to-burgundy",
  "bg-gradient-to-br from-beige to-gold",
  "bg-gradient-to-br from-[#8b5e4e] to-[#4e362d]",
  "bg-gradient-to-br from-blush to-rose",
  "bg-gradient-to-br from-burgundy to-burgundy-deep",
];

const GalleryItem = ({
  item,
  index,
}: {
  item: string;
  index: number;
}) => {
  return (
    <div
      className={[
        "group relative aspect-square w-[145px] shrink-0",
        "overflow-hidden rounded-[10px] border-2 border-ink",
        "sm:w-[180px] lg:w-[215px]",
        item,
      ].join(" ")}
    >
      <span className="absolute bottom-2 right-2 text-base text-white drop-shadow transition-transform duration-150 group-hover:scale-125 sm:bottom-2.5 sm:right-2.5">
        ♡
      </span>

      <span className="sr-only">
        Gallery image {index + 1}
      </span>
    </div>
  );
};

const Gallery = () => {
  return (
    <section className="overflow-hidden bg-cream py-12 sm:py-16 lg:py-[72px]">
      <div className="mx-auto max-w-site px-4 sm:px-5 md:px-7">
        <div className="mb-7 flex items-end justify-between gap-4 sm:mb-10 lg:mb-12">
          <h2 className="max-w-[180px] font-display text-2xl font-semibold leading-tight text-ink sm:max-w-none sm:text-4xl">
            From our gallery
          </h2>

          <div className="shrink-0">
            <Button
              href="https://www.instagram.com/polaroidsbysolly"
              variant="ghost"
              size="small"
            >
              <span className="sm:hidden">
                Follow us
              </span>

              <span className="hidden sm:inline">
                Follow @polaroidsbysolly
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Moving carousel */}
      <div className="gallery-marquee overflow-hidden">
        <div className="gallery-marquee-track flex w-max items-center">
          {/* First copy */}
          <div className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4">
            {galleryItems.map((item, index) => (
              <GalleryItem
                key={`gallery-${index}`}
                item={item}
                index={index}
              />
            ))}
          </div>

          {/* Duplicate copy for seamless looping */}
          <div
            aria-hidden="true"
            className="flex shrink-0 gap-3 pr-3 sm:gap-4 sm:pr-4"
          >
            {galleryItems.map((item, index) => (
              <GalleryItem
                key={`gallery-duplicate-${index}`}
                item={item}
                index={index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Gallery;