
import {
  createServerClient as _createServerClient,
  serializeCookieHeader,
} from "@supabase/ssr";
import { type NextApiRequest, type NextApiResponse } from "next";

export const createServerClient = (
  req: NextApiRequest,
  res: NextApiResponse
): ReturnType<typeof _createServerClient> => {
  const supabase = _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.keys(req.cookies).map((name) => ({
            name,
            value: req.cookies[name] || "",
          }));
        },
        setAll(cookiesToSet) {
          res.setHeader(
            "Set-Cookie",
            cookiesToSet.map(({ name, value, options }) =>
              serializeCookieHeader(name, value, options)
            )
          );
        },
      },
    }
  );

  return supabase;
};
