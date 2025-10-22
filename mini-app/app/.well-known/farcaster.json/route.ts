import { title } from "@/lib/metadata";

export const dynamic = "force-dynamic";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;
  const accountAssociation = JSON.parse(
    process.env.NEXT_PUBLIC_ACCOUNT_ASSOCIATION ??
      JSON.stringify({
        header: "",
        payload: "",
        signature: "",
      })
  );
  const baseBuilder = JSON.parse(
    process.env.NEXT_PUBLIC_BASE_BUILDER ??
      JSON.stringify({
        allowedAddresses: [],
      })
  );

  const config = {
    accountAssociation,
    baseBuilder,
    miniapp: {
      version: "1",
      name: title,
      iconUrl: `${appUrl}/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/icon.png`,
      buttonTitle: "Launch Mini App",
      splashImageUrl: `${appUrl}/ico.png`,
      splashBackgroundColor: "#000000",
      webhookUrl: `${appUrl}/api/webhook`,
    },
  };

  return Response.json(config);
}
