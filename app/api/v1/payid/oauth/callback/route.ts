import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { OAuthSession } from "@/lib/models/OAuthSession";
import { User } from "@/lib/models/User";
import { exchangeCodeForTokens, getUserInfo } from "@/lib/payid";
import { encryptToken } from "@/lib/crypto";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          "/auth/error?message=Missing authorization code or state",
          request.url,
        ),
      );
    }

    // Retrieve session data
    const session = await OAuthSession.findOne({ state });

    if (!session) {
      return NextResponse.redirect(
        new URL("/auth/error?message=Invalid or expired session", request.url),
      );
    }

    // Validate CSRF
    const stateObject = JSON.parse(Buffer.from(state, "base64url").toString());
    if (stateObject.csrf !== session.csrf) {
      await OAuthSession.deleteOne({ _id: session._id });
      return NextResponse.redirect(
        new URL("/auth/error?message=CSRF validation failed", request.url),
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, session.codeVerifier);

    // Fetch user info
    const userInfo = await getUserInfo(encryptToken(tokens.access_token));

    // Find or create user
    let user = await User.findOne({ email: userInfo.email });

    if (!user) {
      user = await User.create({
        email: userInfo.email,
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        picture: userInfo.picture,
        payTag: userInfo.pay_tag,
        emailVerified: userInfo.email_verified,
        phone: userInfo.phone,
        phoneVerified: userInfo.phone_verified,
      });
    } else {
      // Update user info from PayID
      user.firstName = userInfo.given_name || user.firstName;
      user.lastName = userInfo.family_name || user.lastName;
      user.picture = userInfo.picture || user.picture;
      user.payTag = userInfo.pay_tag;
      user.emailVerified = userInfo.email_verified;
      user.phone = userInfo.phone || user.phone;
      user.phoneVerified = userInfo.phone_verified || user.phoneVerified;
    }

    // Update user with PayID data
    user.kycData = {
      payidKyc: {
        accessToken: encryptToken(tokens.access_token),
        refreshToken: encryptToken(tokens.refresh_token),
        idToken: encryptToken(tokens.id_token),
        payidSub: userInfo.sub,
        payTag: userInfo.pay_tag,
        kycVerified: userInfo.kyc_verified || false,
        verificationLevel: userInfo.verification_level || null,
        updatedAt: new Date(),
      },
    };
    await user.save();

    // Clear session
    await OAuthSession.deleteOne({ _id: session._id });

    // Redirect to success page
    const redirectUrl = new URL("/auth/success", request.url);
    redirectUrl.searchParams.set("connected", "true");
    redirectUrl.searchParams.set(
      "kycVerified",
      String(userInfo.kyc_verified || false),
    );

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/auth/error?message=${encodeURIComponent(error instanceof Error ? error.message : "OAuth callback failed")}`,
        request.url,
      ),
    );
  }
}
