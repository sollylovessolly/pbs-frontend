import Link from "next/link";

const shopLinks = [
  { label: "Book our Polaroid station", href: "/polaroid-station" },
  {
    label: "Polaroid Prints",
    href: "/products/polaroids",
  },
  {
    label: "Photostrips",
    href: "/products/photostrips",
  },
  {
    label: "Vintage Letters",
    href: "/products/vintage-letters",
  },
  {
    label: "Phone Cases",
    href: "/products/phone-cases",
  },
  {
    label: "Photo Albums",
    href: "/products/albums",
  },
];

const supportLinks = [
  {
    label: "Track My Order",
    href: "/track-order",
  },
  {
    label: "Delivery Info",
    href: "/delivery",
  },
  {
    label: "FAQs",
    href: "/#faqs",
  },
];

const companyLinks = [
  { label: "Reviews", href: "/reviews" },
  { label: "Gallery", href: "/gallery" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  {
    label: "About Us",
    href: "/about",
  },
];

const Footer = () => {
  return (
    <footer className="bg-burgundy pb-5 pt-10 text-cream sm:pt-12 lg:pb-7 lg:pt-16">
      <div className="mx-auto max-w-site px-4 sm:px-5 md:px-7">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 border-b border-cream/25 pb-8 sm:pb-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-9 lg:pb-11">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 font-display text-xl font-black text-cream sm:text-2xl"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-blush" />
              PolaroidsBySolly
            </Link>

            <p className="mt-3 max-w-[290px] font-sans text-xs leading-5 text-[#e3bfb8] sm:text-[13.5px] sm:leading-6">
              Personalised prints and Polaroid stations for your celebrations.
              Turning your favourite moments into keepsakes worth keeping.
            </p>
          </div>

          <FooterColumn title="Shop" links={shopLinks} />

          {/* Support */}
          <div>
            <FooterHeading>Support</FooterHeading>

            <ul className="flex flex-col gap-2.5">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}

              <li>
                <a
                  href="https://wa.me/2347088694074"
                  target="_blank"
                  rel="noreferrer"
                  className="font-sans text-[13px] text-[#f3e3de] transition-colors hover:text-cream sm:text-sm"
                >
                  WhatsApp Us
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <FooterHeading>Company</FooterHeading>

            <ul className="flex flex-col gap-2.5">
              <li>
                <a
                  href="https://www.instagram.com/polaroidsbysolly"
                  target="_blank"
                  rel="noreferrer"
                  className="font-sans text-[13px] text-[#f3e3de] transition-colors hover:text-cream sm:text-sm"
                >
                  Instagram
                </a>
              </li>

              {companyLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-5 font-sans text-[11px] leading-5 text-[#e3bfb8] sm:flex-row sm:items-center sm:justify-between sm:text-xs">
          <span>
            © {new Date().getFullYear()} PolaroidsBySolly. Created by Solly. All
            rights reserved.
          </span>

          <a
            href="mailto:polaroidsbysolly@gmail.com"
            className="transition-colors hover:text-cream"
          >
            polaroidsbysolly@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
};

type FooterColumnProps = {
  title: string;
  links: {
    label: string;
    href: string;
  }[];
};

const FooterColumn = ({ title, links }: FooterColumnProps) => {
  return (
    <div>
      <FooterHeading>{title}</FooterHeading>

      <ul className="flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <FooterLink href={link.href}>{link.label}</FooterLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

type FooterHeadingProps = {
  children: React.ReactNode;
};

const FooterHeading = ({ children }: FooterHeadingProps) => {
  return (
    <h4 className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.06em] text-blush sm:mb-4 sm:text-[13px]">
      {children}
    </h4>
  );
};

type FooterLinkProps = {
  href: string;
  children: React.ReactNode;
};

const FooterLink = ({ href, children }: FooterLinkProps) => {
  return (
    <Link
      href={href}
      className="font-sans text-[13px] text-[#f3e3de] transition-colors hover:text-cream sm:text-sm"
    >
      {children}
    </Link>
  );
};

export default Footer;
