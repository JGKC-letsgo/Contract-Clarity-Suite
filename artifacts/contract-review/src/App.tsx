import { useEffect, useRef } from "react";
import { useParams, Redirect } from "wouter";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
import NewContract from "@/pages/new-contract";
import ContractView from "@/pages/contract-view";
import ContractVersions from "@/pages/contract-versions";
import ContractComments from "@/pages/contract-comments";
import Templates from "@/pages/templates";
import SharedContract from "@/pages/shared-contract";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(222 47% 11%)",
    colorForeground: "hsl(222 84% 5%)",
    colorMutedForeground: "hsl(215 16% 47%)",
    colorDanger: "hsl(0 84% 60%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(214 32% 96%)",
    colorInputForeground: "hsl(222 84% 5%)",
    colorNeutral: "hsl(214 32% 91%)",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-slate-200",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-slate-900 font-bold",
    headerSubtitle: "text-slate-500",
    socialButtonsBlockButtonText: "text-slate-700 font-medium",
    formFieldLabel: "text-slate-700 font-medium",
    footerActionLink: "text-slate-900 font-semibold hover:text-slate-700",
    footerActionText: "text-slate-500",
    dividerText: "text-slate-400",
    identityPreviewEditButton: "text-slate-900",
    formFieldSuccessText: "text-green-600",
    alertText: "text-slate-700",
    logoBox: "flex justify-center py-2",
    logoImage: "h-10 w-10",
    socialButtonsBlockButton: "border border-slate-200 hover:bg-slate-50",
    formButtonPrimary: "bg-slate-900 hover:bg-slate-700 text-white",
    formFieldInput: "border-slate-200 bg-slate-50 text-slate-900 focus:border-slate-400 focus:ring-slate-400",
    footerAction: "bg-slate-50 border-t border-slate-100",
    dividerLine: "bg-slate-200",
    alert: "bg-slate-50 border-slate-200",
    otpCodeFieldInput: "border-slate-200 bg-slate-50 text-slate-900",
    formFieldRow: "gap-2",
    main: "gap-4",
  },
};

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ContractViewRoute() {
  const params = useParams();
  if (!params.id) return null;
  return <ContractView id={parseInt(params.id)} />;
}

function ContractVersionsRoute() {
  const params = useParams();
  if (!params.id) return null;
  return <ContractVersions id={parseInt(params.id)} />;
}

function ContractCommentsRoute() {
  const params = useParams();
  if (!params.id) return null;
  return <ContractComments id={parseInt(params.id)} />;
}

function SharedContractRoute() {
  const params = useParams();
  if (!params.token) return null;
  return <SharedContract token={params.token} />;
}

function AppRouter() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/shared/:token" component={SharedContractRoute} />

      {/* Landing / Dashboard home */}
      <Route path="/">
        <>
          <Show when="signed-in">
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </Show>
          <Show when="signed-out">
            <Landing />
          </Show>
        </>
      </Route>

      {/* Protected routes */}
      <Route>
        <>
          <Show when="signed-in">
            <AppLayout>
              <Switch>
                <Route path="/contracts/new" component={NewContract} />
                <Route path="/templates" component={Templates} />
                <Route path="/contracts/:id/versions" component={ContractVersionsRoute} />
                <Route path="/contracts/:id/comments" component={ContractCommentsRoute} />
                <Route path="/contracts/:id" component={ContractViewRoute} />
                <Route component={NotFound} />
              </Switch>
            </AppLayout>
          </Show>
          <Show when="signed-out">
            <Redirect to="/sign-in" />
          </Show>
        </>
      </Route>
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back to Legalese", subtitle: "Sign in to access your contracts" } },
        signUp: { start: { title: "Get started with Legalese", subtitle: "Create your account to review contracts with AI" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <AppRouter />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
