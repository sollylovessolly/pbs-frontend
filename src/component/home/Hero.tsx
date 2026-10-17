import Image from "next/image";
import Button from "@/component/ui/Button";

const heroPolaroids = [
  {
    src: "/images/hero/polaroid01.png",
    position: "top-[-35px] left-[2%] w-[135px] -rotate-[12deg] sm:w-[165px]",
    floatClass: "hero-float-one",
  },
  {
    src: "/images/hero/polaroid02.png",
    position: "top-[20%] left-[5%] w-[120px] rotate-[7deg] sm:w-[155px]",
    floatClass: "hero-float-two",
  },
  {
    src: "/images/hero/polaroid03.png",
    position: "bottom-[-35px] left-[3%] w-[145px] rotate-[8deg] sm:w-[185px]",
    floatClass: "hero-float-three",
  },
  {
    src: "/images/hero/polaroid02.png",
    position: "top-[-45px] right-[3%] w-[140px] rotate-[10deg] sm:w-[175px]",
    floatClass: "hero-float-two",
  },
  {
    src: "/images/hero/polaroid03.png",
    position: "top-[24%] right-[5%] w-[125px] -rotate-[8deg] sm:w-[165px]",
    floatClass: "hero-float-one",
  },
  {
    src: "/images/hero/polaroid01.png",
    position: "bottom-[-45px] right-[2%] w-[150px] -rotate-[5deg] sm:w-[195px]",
    floatClass: "hero-float-three",
  },
  {
    src: "/images/hero/polaroid03.png",
    position: "top-[-55px] left-[28%] hidden w-[120px] rotate-[5deg] lg:block",
    floatClass: "hero-float-three",
  },
  {
    src: "/images/hero/polaroid01.png",
    position:
      "bottom-[-70px] left-[26%] hidden w-[135px] -rotate-[10deg] lg:block",
    floatClass: "hero-float-one",
  },
  {
    src: "/images/hero/polaroid02.png",
    position:
      "top-[-50px] right-[28%] hidden w-[120px] -rotate-[6deg] lg:block",
    floatClass: "hero-float-two",
  },
  {
    src: "/images/hero/polaroid03.png",
    position:
      "bottom-[-75px] right-[26%] hidden w-[135px] rotate-[9deg] lg:block",
    floatClass: "hero-float-three",
  },
];

const Hero = () => {
  return (
    <>
      <section className="relative min-h-[560px] overflow-hidden bg-blush sm:min-h-[720px]">
        {/* Starts from the far-left edge and covers the hero */}
        <div className="hero-cover absolute inset-0 z-0 bg-burgundy" />

        {/* Text appears after the burgundy transition */}
        <div className="hero-copy-reveal relative z-30 mx-auto flex min-h-[560px] max-w-[960px] flex-col items-center justify-center px-5 pt-32 pb-28 text-center sm:min-h-[720px] sm:px-7 sm:py-20">
          <span className="mb-5 w-fit -rotate-3 rounded-md border-2 border-ink bg-beige px-3 py-1 font-handwritten text-base font-bold text-ink shadow-soft sm:mb-6 sm:px-4 sm:text-xl">
            from your camera roll to your celebrations
          </span>

          <h1 className="max-w-[680px] font-poster text-[36px] leading-[0.98] font-semibold text-cream sm:text-6xl lg:text-7xl">
            Turn your favorite
            <br />
            memories into <em className="font-medium text-blush">keepsakes</em>
          </h1>

          <p className="mt-5 max-w-[560px] font-sans text-sm leading-6 text-[#f3e3de] sm:mt-7 sm:text-[17px] sm:leading-7">
            Order personalised prints from your camera roll, or bring our
            Polaroid station to your next event. Memories to hold, wherever you
            make them.
          </p>

          <div className="mt-6 flex w-full max-w-[320px] flex-col justify-center gap-3 sm:mt-8 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4">
            <Button
              href="/products"
              variant="ghost"
              className="w-full !bg-cream !text-ink sm:w-auto"
            >
              Start Creating →
            </Button>

            <Button
              href="/polaroid-station"
              variant="ghost"
              className="w-full !border-cream !bg-transparent !text-cream sm:w-auto"
            >
              Book our Polaroid station
            </Button>
          </div>

          <div className="mt-8 flex max-w-[300px] flex-col justify-center gap-2 text-xs font-semibold text-[#ebd3cd] sm:mt-11 sm:max-w-none sm:flex-row sm:flex-wrap sm:gap-x-7 sm:gap-y-3 sm:text-[13px]">
            <TrustItem text="Delivery across Lagos & Nigeria" />
            <TrustItem text="Pay securely online" />
            <TrustItem text="Loved by 2,000+ customers" />
          </div>
        </div>

        <div
          aria-hidden="true"
          data-testid="mobile-hero-polaroids"
          className="pointer-events-none absolute inset-0 z-20 sm:hidden"
        >
          <HeroImage
            src="/images/hero/polaroid01.png"
            className="left-5 top-3 w-[85px] -rotate-12"
            floatClass="hero-float-one"
            revealDelay="0.4s"
            floatDelay="0s"
          />
          <HeroImage
            src="/images/hero/polaroid02.png"
            className="right-5 top-2 w-[85px] rotate-12"
            floatClass="hero-float-two"
            revealDelay="0.6s"
            floatDelay="-1s"
          />
          <HeroImage
            src="/images/hero/polaroid03.png"
            className="bottom-0 left-8 w-[75px] rotate-6"
            floatClass="hero-float-three"
            revealDelay="0.8s"
            floatDelay="-2s"
          />
          <HeroImage
            src="/images/hero/polaroid01.png"
            className="bottom-0 right-8 w-[75px] -rotate-6"
            floatClass="hero-float-one"
            revealDelay="1s"
            floatDelay="-1s"
          />
        </div>

        {/* Polaroids appear after the text */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 hidden sm:block"
        >
          {heroPolaroids.map((polaroid, index) => (
            <HeroImage
              key={`${polaroid.src}-${index}`}
              src={polaroid.src}
              className={polaroid.position}
              floatClass={polaroid.floatClass}
              revealDelay={`${2.5 + index * 0.12}s`}
              floatDelay={`${index * -0.45}s`}
              priority={index < 4}
            />
          ))}
        </div>

        <span className="hero-sticker-reveal hero-float-two absolute top-[14%] right-[8%] z-40 hidden rotate-[9deg] rounded-md border-2 border-ink bg-blush px-4 py-1 font-handwritten text-xl font-bold text-ink shadow-soft sm:inline-flex">
          bestie era ✨
        </span>

        <span className="hero-sticker-reveal hero-float-one absolute right-[7%] bottom-[12%] z-40 hidden -rotate-[8deg] rounded-md border-2 border-ink bg-burgundy px-4 py-1 font-handwritten text-xl font-bold text-cream shadow-soft sm:inline-flex">
          printed with love
        </span>
      </section>
    </>
  );
};

type TrustItemProps = {
  text: string;
};

const TrustItem = ({ text }: TrustItemProps) => {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full bg-blush" />
      {text}
    </span>
  );
};

type HeroImageProps = {
  src: string;
  className: string;
  floatClass: string;
  revealDelay: string;
  floatDelay: string;
  priority?: boolean;
};

const HeroImage = ({
  src,
  className,
  floatClass,
  revealDelay,
  floatDelay,
  priority = false,
}: HeroImageProps) => {
  return (
    <div className={`absolute ${className}`}>
      <div
        className="hero-polaroid-reveal"
        style={{ animationDelay: revealDelay }}
      >
        <div className={floatClass} style={{ animationDelay: floatDelay }}>
          <Image
            src={src}
            alt=""
            width={500}
            height={650}
            priority={priority}
            sizes="(max-width: 768px) 160px, 200px"
            className="h-auto w-full object-contain drop-shadow-[6px_10px_0_rgba(42,33,28,0.16)]"
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;
