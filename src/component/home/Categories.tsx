import Image from "next/image";
import Link from "next/link";

const categories = [
  {
    title: "Polaroid Prints",
    description: "Classic frame, your photo",
    href: "/products/polaroids",
    src: "/images/gallery/product-showcase/polaroids-prints.jpeg",
    alt: "A collection of premium polaroid prints",
  },
  {
    title: "Photostrips",
    description: "2–4 photos, one strip",
    href: "/products/photostrips",
    src: "/images/gallery/product-showcase/photostrips-keepsakes.jpeg",
    alt: "A personalised photo strip",
  },
  {
    title: "Vintage Letters",
    description: "A note, kept forever",
    href: "/products/vintage-letters",
    src: "/images/gallery/product-showcase/vintage-letters-burnt-edges.jpeg",
    alt: "A handwritten vintage letter",
  },
  {
    title: "Phone Cases",
    description: "Wear the memory daily",
    href: "/products/phone-cases",
    src: "/images/products/phone-case.jpg",
    alt: "A personalised polaroid phone case",
  },
  {
    title: "Photo Albums",
    description: "A whole story, bound",
    href: "/products/albums",
    src: "/images/products/albums.jpg",
    alt: "A personalised photo album",
  },
];

const Categories = () => {
  return (
    <section id="categories" className="bg-cream py-12 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-site px-4 sm:px-5 md:px-7">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:mb-10 md:flex-row md:items-end lg:mb-12">
          <div>
            <span className="inline-flex -rotate-3 rounded-full border-2 border-ink bg-beige px-3 py-1 font-handwritten text-base font-bold text-ink shadow-soft sm:px-4 sm:text-xl">
              pick a keepsake
            </span>

            <h2 className="mt-3 max-w-[320px] font-display text-2xl font-semibold leading-tight text-ink sm:mt-4 sm:max-w-none sm:text-4xl">
              What are we printing today?
            </h2>
          </div>

          <p className="max-w-[460px] font-sans text-sm leading-6 text-brown sm:text-[15px]">
            From a single polaroid to a full album — every product starts with a
            photo that means something.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="group min-w-0 rounded-[14px] border-2 border-ink bg-paper p-2.5 text-center shadow-soft transition-[transform,box-shadow] duration-150 sm:rounded-card sm:px-[18px] sm:py-5 sm:hover:-translate-y-1 sm:hover:shadow-card"
            >
              <div className="relative mb-2.5 aspect-square w-full overflow-hidden rounded-[8px] border-2 border-ink bg-beige sm:mb-4 sm:rounded-[10px]">
                <Image
                  src={category.src}
                  alt={category.alt}
                  fill
                  sizes="(max-width: 639px) 50vw, (max-width: 1024px) 50vw, 20vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <h3 className="font-display text-sm font-semibold leading-5 text-ink transition-colors group-hover:text-burgundy sm:text-[17px]">
                {category.title}
              </h3>

              <p className="mt-1 line-clamp-2 font-sans text-[10px] leading-4 text-brown sm:mt-1.5 sm:text-xs">
                {category.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
