"use client";

import { useState } from "react";

const faqs = [
  {
    question: "How long does delivery take?",
    answer:
      "Production usually takes 24–48 hours for Polaroids, phone cases, and photostrips. Delivery time depends on your location and begins after your order is ready.",
  },
  {
    question: "Can I order more than one product together?",
    answer:
      "Yes. You can add different products to your cart and pay for them together in one order.",
  },
  {
    question: "What photo quality do I need to upload?",
    answer:
      "Use a clear, well-lit photo with the highest quality available. Avoid blurry screenshots or heavily compressed images for the best print result.",
  },
  {
    question: "Do you deliver outside Lagos?",
    answer:
      "Yes. We offer delivery within Lagos and to other states in Nigeria. The delivery fee is calculated based on the selected location.",
  },
];

const FaqPreview = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex((currentIndex) =>
      currentIndex === index ? null : index
    );
  };

  return (
    <section className="bg-cream py-24">
      <div className="mx-auto max-w-site px-7">
        <div className="mb-12 flex flex-col items-center text-center">
          <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
            Questions, answered
          </h2>

          <p className="mt-3 max-w-[460px] font-sans text-[15px] leading-6 text-brown">
            Still unsure about something? Here&apos;s what people ask us most.
          </p>
        </div>

        <div className="mx-auto max-w-[760px]">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.question}
                className="border-b-2 border-ink"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left"
                >
                  <h3 className="font-display text-base font-semibold text-ink sm:text-[17px]">
                    {faq.question}
                  </h3>

                  <span
                    aria-hidden="true"
                    className={`shrink-0 font-display text-2xl text-burgundy transition-transform duration-200 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-300 ${
                    isOpen
                      ? "grid-rows-[1fr]"
                      : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[650px] pb-6 font-sans text-sm leading-6 text-brown">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FaqPreview;