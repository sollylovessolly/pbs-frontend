import Button from "@/component/ui/Button";
import { LuCamera, LuPartyPopper } from "react-icons/lu";

export default function PolaroidStation() {
  return (
    <section
      className="bg-cream px-4 pt-2 pb-14 sm:px-5 sm:pt-3 sm:pb-20 md:px-7"
      aria-labelledby="station-title"
    >
      <div className="mx-auto grid max-w-site gap-8 rounded-3xl border-2 border-ink bg-blush p-6 sm:p-10 md:grid-cols-2 md:items-center">
        <div>
          <span className="inline-block -rotate-2 rounded-full border-2 border-ink bg-blush px-4 py-1 font-handwritten text-xl">
            or, bring us to the celebration
          </span>
          <h2
            id="station-title"
            className="mt-6 font-serif text-3xl leading-tight sm:text-5xl"
          >
            Looking to capture moments at your event?
          </h2>
          <p className="mt-5 max-w-lg leading-7">
            Have a Polaroid station at your wedding, party or brand event. We
            turn moments from the celebration into prints your guests can take
            home.
          </p>
          <div className="mt-6">
            <Button href="/polaroid-station">
              Book our Polaroid station →
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border-2 border-ink bg-paper p-6 sm:p-8">
          <LuCamera aria-hidden className="h-10 w-10 text-burgundy" />
          <h3 className="mt-5 font-serif text-2xl">
            Made for gathering together
          </h3>
          <p className="mt-3 leading-7 text-ink/75">
            Weddings, birthdays, celebrations and brand events — tell us what
            you’re planning and we’ll talk through the station with you.
          </p>
          <div className="mt-6 flex items-center gap-3 border-t border-ink/20 pt-5 text-sm font-bold">
            <LuPartyPopper
              aria-hidden
              className="h-6 w-6 shrink-0 text-burgundy"
            />
            Enquire about your date for a tailored quote.
          </div>
        </div>
      </div>
    </section>
  );
}
