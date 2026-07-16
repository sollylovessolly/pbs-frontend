type PaperTearProps = {
  src?: string;
  position?: "top" | "bottom";
  flip?: boolean;
  className?: string;
};

const PaperTear = ({
  src = "/images/decorations/paper-tear-1.svg",
  position = "bottom",
  flip = false,
  className = "",
}: PaperTearProps) => {
  return (
    <div
      aria-hidden="true"
      className={[
        "paper-tear",
        `paper-tear-${position}`,
        flip ? "paper-tear-flipped" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <img
        src={src}
        alt=""
        draggable={false}
      />
    </div>
  );
};

export default PaperTear;