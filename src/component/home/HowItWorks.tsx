const steps = [
  {
    number: 1,
    title: "Upload photos",
    description: "Pick your favourite shots straight from your gallery.",
  },
  {
    number: 2,
    title: "Customise",
    description: "Crop and adjust your keepsake until it feels right.",
  },
  {
    number: 3,
    title: "Pay securely",
    description: "Checkout online. Production starts after payment.",
  },
  {
    number: 4,
    title: "Get it delivered",
    description: "We print, pack and send it straight to your door.",
  },
];

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 bg-cream pt-10 pb-4 sm:pt-14 sm:pb-5 lg:pt-[72px]"
    >
      <div className="mx-auto max-w-site px-4 sm:px-5 md:px-7">
        <div className="overflow-hidden rounded-[18px] border-2 border-ink bg-beige py-7 shadow-soft sm:rounded-panel sm:px-10 sm:py-10 lg:px-14 lg:py-14">
          <div className="px-4 sm:px-0">
            <span className="inline-flex -rotate-3 rounded-full border-2 border-ink bg-blush px-3 py-1 font-handwritten text-base font-bold text-ink shadow-soft sm:px-4 sm:text-xl">
              it&apos;s easier than it looks
            </span>

            <div className="mt-4 flex items-center justify-between gap-3">
              <h2 className="whitespace-nowrap font-display text-[clamp(1rem,4.6vw,1.5rem)] font-semibold leading-none tracking-[-0.045em] text-ink sm:text-[clamp(26px,3vw,34px)] sm:tracking-tight">
                How PolaroidsBySolly works
              </h2>

              <span className="shrink-0 text-[10px] font-bold text-brown/70 lg:hidden">
                Swipe →
              </span>
            </div>
          </div>

          <p className="mt-4 px-4 text-sm leading-6 text-brown sm:px-0">
            For prints delivered to your door, start here.
          </p>

          <div className="mt-7 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-0 lg:mt-9 lg:overflow-visible lg:pb-0">
            <div className="flex w-max snap-x snap-mandatory items-stretch gap-4 lg:grid lg:w-full lg:grid-cols-4 lg:gap-0">
              {steps.map((step, index) => (
                <article
                  key={step.number}
                  className="relative w-[210px] shrink-0 snap-start rounded-[14px] border-2 border-ink/15 bg-cream/60 p-4 sm:w-[245px] sm:p-5 lg:w-auto lg:rounded-none lg:border-0 lg:bg-transparent lg:px-5 lg:py-0"
                >
                  {index < steps.length - 1 && (
                    <div className="absolute left-[72px] top-[26px] hidden w-[calc(100%-72px)] border-t-2 border-dashed border-ink/40 lg:block" />
                  )}

                  <div className="relative z-10 mb-3 flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink bg-burgundy font-display text-lg font-bold text-cream sm:mb-4 sm:h-[52px] sm:w-[52px] sm:text-xl">
                    {step.number}
                  </div>

                  <h3 className="font-display text-base font-semibold leading-5 text-ink sm:text-[17px]">
                    {step.title}
                  </h3>

                  <p className="mt-2 font-sans text-xs leading-5 text-brown sm:text-[13.5px] sm:leading-6">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
