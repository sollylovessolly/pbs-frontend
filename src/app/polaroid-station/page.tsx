import Image from "next/image";
import Link from "next/link";
import StationBooking from "@/component/events/StationBooking";

export const metadata = {
  title: "Book our Polaroid station | PolaroidsBySolly",
  description:
    "Polaroid station prints for weddings, birthdays and events. Enquire about your date and get a tailored quote from PolaroidsBySolly.",
};

export default function PolaroidStationPage() {
  return (
    <main className="bg-cream text-ink">
      <section className="relative isolate overflow-hidden bg-burgundy px-5 py-14 text-cream sm:py-20">
        <Image
          src="/images/station/booking-hero.jpeg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[center_35%] sm:object-[center_30%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-burgundy/95 via-burgundy/85 to-burgundy/45"
        />
        <div className="mx-auto max-w-site">
          <Link href="/" className="text-sm underline underline-offset-4">
            Home
          </Link>
          <p className="mt-8 font-handwritten text-2xl text-blush">
            bring the memories home
          </p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight sm:text-6xl">
            Book our Polaroid station
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-cream/90">
            A celebration worth remembering. A print worth keeping. Bring our
            Polaroid station to your event and give your guests a little piece
            of the day to take home.
          </p>
          <a
            href="#enquire"
            className="mt-7 inline-block rounded-lg border-2 border-ink bg-cream px-6 py-3 font-bold text-ink shadow-button"
          >
            Enquire about your date →
          </a>
        </div>
      </section>
      <div className="mx-auto grid max-w-site gap-10 px-5 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <h2 className="font-serif text-3xl">
            From the party to the photo album.
          </h2>
          <p className="mt-4 leading-7 text-ink/75">
            Whether it’s a wedding, a birthday or a brand celebration, make
            space for memories your guests can hold. We’ll discuss your venue,
            guest count and timing to plan your station.
          </p>
          <ol className="mt-8 space-y-6">
            {[
              [
                "Tell us your plans",
                "Share your date, location and a little about the event.",
              ],
              [
                "Let’s work out the details",
                "We’ll discuss availability, the station setup and a quote for your event.",
              ],
              [
                "Confirm, then celebrate",
                "We’ll agree the booking and payment details with you before your event.",
              ],
            ].map(([title, description], index) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-blush font-bold">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-ink/70">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm">
            Looking for prints delivered to you?{" "}
            <Link
              href="/products"
              className="font-bold text-burgundy underline"
            >
              Shop keepsakes
            </Link>
          </p>
        </div>
        <StationBooking />
      </div>
    </main>
  );
}
