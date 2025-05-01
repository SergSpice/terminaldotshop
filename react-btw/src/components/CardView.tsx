import QRCode from "react-qr-code";
import { useLocation } from "react-router";

export function CardView() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const collect = queryParams.get('url');

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 gap-5">
      <h1 className="text-lg">Add payment information</h1>
      <p>To securely add a payment information, scan the QR code or click the link below.</p>
      {!!collect && (
        <>
          <div className="w-50 h-50 flex flex-col items-center justify-center p-4">
            <QRCode
              size={256}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              value={collect}
              viewBox={`0 0 256 256`}
            />
          </div>
          <div className="text-sm italic text-slate-200">or</div>
          <a href={collect}>Open Link</a>
        </>
      )}
      <strong className="pt-6 italict">
        NOTE: After you add your payment information don't forget to refresh the "Registered Card" section
      </strong>
    </div>
  );
}
