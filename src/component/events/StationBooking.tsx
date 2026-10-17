"use client";

import { useState, type FormEvent } from "react";
import Button from "@/component/ui/Button";

export default function StationBooking() {
  const [messageUrl, setMessageUrl] = useState("");
  const fieldClass =
    "mt-2 w-full min-w-0 rounded-xl border-2 border-ink bg-cream px-3 py-3 text-base focus:outline-burgundy";
  function prepareEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = [
      "Hi Solly! I'd like to book your Polaroid station.",
      `Name: ${data.get("name")}`,
      `Event: ${data.get("event")}`,
      `Date: ${data.get("date") || "Still deciding"}`,
      `Venue / city: ${data.get("location")}`,
      `Estimated guests: ${data.get("guests") || "Still deciding"}`,
      `Time / duration: ${data.get("time") || "To be confirmed"}`,
      `Anything else: ${data.get("notes") || "None yet"}`,
      "Please let me know your availability and a quote.",
    ].join("\n");
    setMessageUrl(
      `https://wa.me/2347088694074?text=${encodeURIComponent(message)}`,
    );
  }
  return (
    <section
      id="enquire"
      className="scroll-mt-28 rounded-3xl border-2 border-ink bg-paper p-5 shadow-[5px_6px_0_#2A211C] sm:p-8"
    >
      <h2 className="font-serif text-3xl">Tell us about your event</h2>
      <p className="mt-3 text-sm leading-6 text-ink/70">
        We’ll confirm availability and put together a quote on WhatsApp. Your
        date is only booked once we confirm it with you.
      </p>
      <form
        className="mt-6 grid gap-5 sm:grid-cols-2"
        onSubmit={prepareEnquiry}
        onChange={() => setMessageUrl("")}
      >
        <label className="text-sm font-bold">
          Your name
          <input
            className={fieldClass}
            name="name"
            autoComplete="name"
            required
            maxLength={100}
          />
        </label>
        <label className="text-sm font-bold">
          Event type
          <select className={fieldClass} name="event" required defaultValue="">
            <option value="" disabled>
              Choose your event
            </option>
            {[
              "Wedding",
              "Birthday",
              "Corporate event",
              "Party / celebration",
              "Other",
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-bold">
          Event date (optional)
          <input className={fieldClass} name="date" type="date" />
        </label>
        <label className="text-sm font-bold">
          Venue / city
          <input
            className={fieldClass}
            name="location"
            placeholder="e.g. Lekki, Lagos"
            required
            maxLength={200}
          />
        </label>
        <label className="text-sm font-bold">
          Estimated guests (optional)
          <input
            className={fieldClass}
            name="guests"
            type="number"
            min={1}
            max={100000}
            step={1}
            inputMode="numeric"
          />
        </label>
        <label className="text-sm font-bold">
          Time / duration (optional)
          <input
            className={fieldClass}
            name="time"
            placeholder="e.g. 3–6 pm"
            maxLength={100}
          />
        </label>
        <label className="text-sm font-bold sm:col-span-2">
          Anything else? (optional)
          <textarea
            className={fieldClass}
            name="notes"
            rows={3}
            maxLength={1500}
            placeholder="Your theme, ideas or questions…"
          />
        </label>
        <div className="sm:col-span-2">
          {messageUrl ? (
            <div role="status" className="rounded-xl bg-blush p-4">
              <p className="mb-3 text-sm">
                Your enquiry is ready. Open WhatsApp and send it to us.
              </p>
              <a
                href={messageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-lg border-2 border-ink bg-burgundy px-5 py-3 font-bold text-cream"
              >
                Send on WhatsApp →
              </a>
            </div>
          ) : (
            <Button type="submit" fullWidth>
              Continue to WhatsApp →
            </Button>
          )}
          <p className="mt-3 text-xs leading-5 text-ink/60">
            No payment here. Your details are sent only when you send the
            message in WhatsApp.
          </p>
        </div>
      </form>
    </section>
  );
}
