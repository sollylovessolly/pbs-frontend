"use client";
import { useAdmin } from "./AdminShell";
import { KeyValues, PageHeader, Panel } from "./primitives";
export default function Settings() {
  const { admin } = useAdmin();
  return (
    <>
      <PageHeader
        title="Settings & follow-ups"
        description="A few things to keep your studio running smoothly."
      />
      <Panel title="Your account">
        <KeyValues
          record={{ name: admin.name, email: admin.email }}
          fields={[{ key: "name" }, { key: "email" }]}
        />
        <p className="adm-muted">
          Your session is kept in this browser tab. Sign out when you finish
          using a shared device.
        </p>
      </Panel>
      <Panel title="Reminder: come back for the backend fixes">
        <p>
          The frontend is connected to the available API. These backend
          follow-ups need a separate verification pass before the full launch.
          Some fixes may already exist in the backend; confirm them on the
          deployed API:
        </p>
        <ol className="adm-followups">
          <li>Limit public API responses to customer-safe fields.</li>
          <li>
            Save personalised phone-case artwork and expose authoritative
            package prices and stock.
          </li>
          <li>
            Make order creation and payment retries safe from duplicates, and
            recover paid orders when stock changes.
          </li>
          <li>
            Validate courier quotes against the order and clarify courier
            pricing versus customer delivery fees.
          </li>
          <li>Strengthen customer-field and production-upload validation.</li>
          <li>
            Return delivery-rate IDs so existing rates can be edited here;
            expose inactive catalogue records to admins.
          </li>
          <li>
            Complete API response schemas and confirm print dimensions, payment
            callbacks, storage, email and delivery configuration.
          </li>
        </ol>
        <p className="adm-muted">
          The detailed handoff is saved in BACKEND-FOLLOWUPS.md in the project.
        </p>
      </Panel>
    </>
  );
}
