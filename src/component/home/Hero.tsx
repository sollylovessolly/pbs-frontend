import Image from "next/image";
import Button from "@/component/ui/Button";

const heroPolaroids = [
  {
    src: "/images/hero/polaroid01.png",
    position:
      "top-[-35px] left-[2%] w-[135px] -rotate-[12deg] sm:w-[165px]",
    floatClass: "hero-float-one",
  },
  {
    src: "/images/hero/polaroid02.png",
    position:
      "top-[20%] left-[5%] w-[120px] rotate-[7deg] sm:w-[155px]",
    floatClass: "hero-float-two",
  },
  {
    src: "/images/hero/polaroid03.png",
    position:
      "bottom-[-35px] left-[3%] w-[145px] rotate-[8deg] sm:w-[185px]",
    floatClass: "hero-float-three",
  },
  {
    src: "/images/hero/polaroid02.png",
    position:
      "top-[-45px] right-[3%] w-[140px] rotate-[10deg] sm:w-[175px]",
    floatClass: "hero-float-two",
  },
  {
    src: "/images/hero/polaroid03.png",
    position:
      "top-[24%] right-[5%] w-[125px] -rotate-[8deg] sm:w-[165px]",
    floatClass: "hero-float-one",
  },
  {
    src: "/images/hero/polaroid01.png",
    position:
      "bottom-[-45px] right-[2%] w-[150px] -rotate-[5deg] sm:w-[195px]",
    floatClass: "hero-float-three",
  },
  {
    src: "/images/hero/polaroid03.png",
    position:
      "top-[-55px] left-[28%] hidden w-[120px] rotate-[5deg] lg:block",
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
      <section className="relative min-h-[720px] overflow-hidden bg-blush">
        {/* Starts from the far-left edge and covers the hero */}
        <div className="hero-cover absolute inset-0 z-0 bg-burgundy" />

        {/* Text appears after the burgundy transition */}
        <div className="hero-copy-reveal relative z-30 mx-auto flex min-h-[720px] max-w-[960px] flex-col items-center justify-center px-7 py-20 text-center">
          <span className="mb-6 w-fit -rotate-3 rounded-full border-2 border-ink bg-beige px-4 py-1 font-handwritten text-xl font-bold text-ink shadow-soft">
            made from your camera roll
          </span>

          <h1 className="font-poster text-[clamp(44px,6vw,84px)] leading-[0.98] font-semibold text-cream">
            Turn your favorite
            <br />
            memories into{" "}
            <em className="font-medium text-blush">keepsakes</em>
          </h1>

          <p className="mt-7 max-w-[560px] font-sans text-base leading-7 text-[#f3e3de] sm:text-[17px]">
            Upload the photo, customize it your way, pay securely, and we
            deliver it to your door in Lagos — printed, framed, and ready to
            hold.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              href="/products"
              variant="ghost"
              className="!bg-cream !text-ink"
            >
              Start Creating →
            </Button>

            <Button
              href="/products"
              variant="ghost"
              className="!border-cream !bg-transparent !text-cream"
            >
              Shop Products
            </Button>
          </div>

          <div className="mt-11 flex flex-wrap justify-center gap-x-7 gap-y-3 text-[13px] font-semibold text-[#ebd3cd]">
            <TrustItem text="Delivery across Lagos & Nigeria" />
            <TrustItem text="Pay securely online" />
            <TrustItem text="Loved by 2,000+ customers" />
          </div>
        </div>

        {/* Polaroids appear after the text */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20"
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

        <span className="hero-sticker-reveal hero-float-two absolute top-[14%] right-[8%] z-40 hidden rotate-[9deg] rounded-full border-2 border-ink bg-blush px-4 py-1 font-handwritten text-xl font-bold text-ink shadow-soft sm:inline-flex">
          bestie era ✨
        </span>

        <span className="hero-sticker-reveal hero-float-one absolute right-[7%] bottom-[12%] z-40 hidden -rotate-[8deg] rounded-full border-2 border-ink bg-burgundy px-4 py-1 font-handwritten text-xl font-bold text-cream shadow-soft sm:inline-flex">
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
        <div
          className={floatClass}
          style={{ animationDelay: floatDelay }}
        >
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