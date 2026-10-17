"use client";

import Image from "next/image";
import { useState } from "react";

import Button from "@/component/ui/Button";

const polaroids = [
  {
    src: "/images/hero/polaroid01.png",
    alt: "A favourite memory printed as a Polaroid",
  },
  {
    src: "/images/hero/polaroid02.png",
    alt: "Friends captured in a printed Polaroid",
  },
  {
    src: "/images/hero/polaroid03.png",
    alt: "A special moment turned into a keepsake",
  },
  {
    src: "/images/hero/polaroid01.png",
    alt: "A personal photo printed with care",
  },
];

const cardPositions = [
  {
    x: 0,
    y: 0,
    rotate: -3,
    scale: 1,
  },
  {
    x: 13,
    y: 10,
    rotate: 5,
    scale: 0.97,
  },
  {
    x: -9,
    y: 19,
    rotate: -7,
    scale: 0.94,
  },
  {
    x: 15,
    y: 27,
    rotate: 8,
    scale: 0.91,
  },
];

const AboutUs = ({ showStoryLink = true }: { showStoryLink?: boolean }) => {
  const [frontPhotoIndex, setFrontPhotoIndex] = useState(0);

  const showNextPhoto = () => {
    setFrontPhotoIndex((currentIndex) => (currentIndex + 1) % polaroids.length);
  };

  return (
    <section
      id="about"
      className="overflow-hidden bg-blush py-12 sm:py-16 lg:py-24"
    >
      <div className="mx-auto grid max-w-site items-center gap-8 px-4 sm:gap-10 sm:px-5 md:grid-cols-2 md:px-7 lg:gap-16">
        {/* Interactive Polaroid stack */}
        <div className="order-2 flex justify-center md:order-1 md:justify-start">
          <button
            type="button"
            aria-label="Show the next Polaroid"
            onClick={showNextPhoto}
            className="group relative h-[310px] w-[250px] touch-manipulation sm:h-[430px] sm:w-[355px]"
          >
            {polaroids.map((photo, index) => {
              const position =
                (index - frontPhotoIndex + polaroids.length) % polaroids.length;

              const cardPosition = cardPositions[position];

              return (
                <div
                  key={`${photo.src}-${index}`}
                  className="absolute inset-0 transition-[transform,opacity] duration-500 ease-out"
                  style={{
                    zIndex: polaroids.length - position,
                    opacity: position === polaroids.length - 1 ? 0.88 : 1,
                    transform: `translate(${cardPosition.x}px, ${cardPosition.y}px) rotate(${cardPosition.rotate}deg) scale(${cardPosition.scale})`,
                  }}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(max-width: 767px) 250px, 355px"
                    className="object-contain drop-shadow-[8px_10px_0_rgba(42,33,28,0.14)]"
                  />
                </div>
              );
            })}

            <span className="absolute -bottom-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-ink bg-paper px-3 py-1 font-handwritten text-sm font-bold text-ink shadow-[2px_2px_0_#2A211C] transition-transform group-hover:-translate-y-1">
              tap the photos ✦
            </span>
          </button>
        </div>

        {/* About copy */}
        <div className="order-1 md:order-2">
          <span className="inline-flex -rotate-2 rounded-md border-2 border-ink bg-paper px-3 py-1 font-handwritten text-base font-bold text-ink shadow-[2px_2px_0_#2A211C] sm:px-4 sm:text-xl">
            made from memories
          </span>

          <h2 className="mt-5 font-display text-3xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-4xl lg:text-5xl">
            Little moments deserve somewhere to live.
          </h2>

          <p className="mt-4 max-w-[520px] font-sans text-sm leading-6 text-brown sm:text-base sm:leading-7">
            PolaroidsBySolly started with a simple thought: the photos we love
            should not stay buried in our camera rolls. We turn everyday
            memories into keepsakes you can hold, gift and return to whenever
            you miss the moment.
          </p>

          <p className="mt-4 max-w-[520px] text-sm leading-7 text-brown sm:text-base">
            From personalised prints delivered to your door to Polaroid stations
            at your celebrations, we help you keep the moments that matter.
          </p>

          {showStoryLink && (
            <div className="mt-6">
              <Button href="/about" variant="ghost" size="small">
                Read our story
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
