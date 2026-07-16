const testimonials = [
  {
    quote:
      "I ordered a photostrip for my best friend’s birthday and she literally cried. The print quality was so good.",
    name: "Ada O.",
    location: "Lekki, Lagos",
    avatarStyle: "bg-beige",
  },
  {
    quote:
      "The polaroid phone case came out clearer than I expected, and it arrived earlier than the estimate too.",
    name: "Feyi A.",
    location: "Ikeja, Lagos",
    avatarStyle: "bg-rose",
  },
  {
    quote:
      "I got the album made for my parents’ anniversary. Easy to order, easy to track, beautifully packaged.",
    name: "Chidera N.",
    location: "Abuja",
    avatarStyle: "bg-[#8b5e4e]",
  },
];

const Testimonials = () => {
  return (
    <section className="bg-cream py-24">
      <div className="mx-auto max-w-site px-7">
        <div className="mb-12">
          <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            Loved, kept, gifted
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.name}
              className="rounded-[18px] border-2 border-ink bg-paper p-7 shadow-soft"
            >
              <div
                aria-label="5 out of 5 stars"
                className="mb-4 tracking-[2px] text-gold"
              >
                ★★★★★
              </div>

              <p className="font-sans text-[15px] leading-[1.65] text-ink">
                “{testimonial.quote}”
              </p>

              <div className="mt-5 flex items-center gap-3">
                <div
                  className={`h-[38px] w-[38px] shrink-0 rounded-full border-2 border-ink ${testimonial.avatarStyle}`}
                />

                <div>
                  <p className="font-sans text-[13.5px] font-bold text-ink">
                    {testimonial.name}
                  </p>

                  <p className="mt-0.5 font-sans text-xs text-brown">
                    {testimonial.location}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;