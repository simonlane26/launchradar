import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      {/* hash routing: keeps <SignIn/> self-contained so it can't trip the
          "not a catch-all route" error if it ever renders off /sign-in
          (e.g. a redirect landing after a long server action expires the
          session mid-request). */}
      <SignIn routing="hash" />
    </div>
  );
}
