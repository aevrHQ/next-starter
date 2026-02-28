import AuthForm from "@/components/Auth/Form";
import { Suspense } from "react";

const LoginPage = () => {
  return (
    <div className="wrapper w-full gap-4 max-w-2xl mx-auto px-4 h-full py-12 flex flex-col ">
      <header>
        <div className="wrapper">
          <h1 className="text-4xl font-bold text-background lg:text-foreground">
            Bucket
          </h1>
          <p className="text-lg font-medium text-background lg:text-foreground">
            You don&apos;t have to forget interesting things.
          </p>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center w-full">
        <div className="wrapper w-full">
          <Suspense fallback={null}>
            <AuthForm mode="login" />
          </Suspense>
        </div>
      </section>
    </div>
  );
};

export default LoginPage;
