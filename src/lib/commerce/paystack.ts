type Callbacks = {
  onSuccess: () => void;
  onCancel: () => void;
  onError: () => void;
};
type Popup = new () => {
  resumeTransaction: (accessCode: string, callbacks: Callbacks) => void;
};
declare global {
  interface Window {
    PaystackPop?: Popup;
  }
}
let loading: Promise<Popup> | undefined;
function loadPopup(): Promise<Popup> {
  if (window.PaystackPop) return Promise.resolve(window.PaystackPop);
  if (loading) return loading;
  loading = new Promise<Popup>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v2/inline.js";
    script.async = true;
    const timer = setTimeout(() => fail(), 15000);
    const fail = () => {
      clearTimeout(timer);
      script.remove();
      loading = undefined;
      reject(new Error("Payment could not open. Please try again."));
    };
    script.onerror = fail;
    script.onload = () => {
      clearTimeout(timer);
      if (window.PaystackPop) resolve(window.PaystackPop);
      else fail();
    };
    document.head.appendChild(script);
  });
  return loading;
}
export async function openPaymentPopup(accessCode: string): Promise<boolean> {
  if (!accessCode) throw new Error("Payment could not open. Please retry.");
  const Paystack = await loadPopup();
  return new Promise((resolve, reject) => {
    new Paystack().resumeTransaction(accessCode, {
      onSuccess: () => resolve(true),
      onCancel: () => resolve(false),
      onError: () => reject(new Error("Payment could not open. Please retry.")),
    });
  });
}
