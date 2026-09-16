module.exports = [
"[project]/app/signin/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SignInPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-auth/react/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/api.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
// useSearchParams() opts this subtree out of static rendering, so Next
// requires it inside a Suspense boundary — split into an inner component
// so the outer page export itself stays a plain function.
function SignInForm() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const params = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const callbackUrl = params.get("callbackUrl") ?? "/approvals";
    const [mode, setMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(params.get("mode") === "register" ? "register" : "signin");
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [email, setEmail] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [password, setPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [busy, setBusy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    async function handleSignIn(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["signIn"])("credentials", {
            email,
            password,
            redirect: false,
            callbackUrl
        });
        setBusy(false);
        if (result?.error) setError("Incorrect email or password.");
        else router.push(callbackUrl);
    }
    async function handleRegister(e) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["registerAccount"])(name, email, password);
            // Registration doesn't itself start a session — sign in right after
            // with the same credentials so this is a single flow for the user.
            const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["signIn"])("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl
            });
            if (result?.error) throw new Error("Account created, but sign-in failed — try signing in below.");
            router.push(callbackUrl);
        } catch (err) {
            setError(err.message);
        } finally{
            setBusy(false);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex min-h-screen items-center justify-center bg-paper",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full max-w-sm border border-line bg-white p-8",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "mb-6 font-sans text-lg font-semibold text-ink",
                    children: mode === "signin" ? "Sign in" : "Create your account"
                }, void 0, false, {
                    fileName: "[project]/app/signin/page.tsx",
                    lineNumber: 54,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$auth$2f$react$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["signIn"])("google", {
                            callbackUrl
                        }),
                    className: "mb-6 w-full border border-line py-2 font-body text-sm text-ink hover:bg-paper",
                    children: "Continue with Google"
                }, void 0, false, {
                    fileName: "[project]/app/signin/page.tsx",
                    lineNumber: 58,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-6 flex items-center gap-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-px flex-1 bg-line"
                        }, void 0, false, {
                            fileName: "[project]/app/signin/page.tsx",
                            lineNumber: 66,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "font-mono text-xs text-slate",
                            children: "or"
                        }, void 0, false, {
                            fileName: "[project]/app/signin/page.tsx",
                            lineNumber: 67,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-px flex-1 bg-line"
                        }, void 0, false, {
                            fileName: "[project]/app/signin/page.tsx",
                            lineNumber: 68,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/signin/page.tsx",
                    lineNumber: 65,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                    onSubmit: mode === "signin" ? handleSignIn : handleRegister,
                    children: [
                        mode === "register" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "mb-1 block font-body text-xs text-slate",
                                    children: "Name"
                                }, void 0, false, {
                                    fileName: "[project]/app/signin/page.tsx",
                                    lineNumber: 74,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    required: true,
                                    value: name,
                                    onChange: (e)=>setName(e.target.value),
                                    className: "mb-4 w-full border border-line px-3 py-2 font-body text-sm text-ink"
                                }, void 0, false, {
                                    fileName: "[project]/app/signin/page.tsx",
                                    lineNumber: 75,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/signin/page.tsx",
                            lineNumber: 73,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "mb-1 block font-body text-xs text-slate",
                            children: "Email"
                        }, void 0, false, {
                            fileName: "[project]/app/signin/page.tsx",
                            lineNumber: 83,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "email",
                            required: true,
                            value: email,
                            onChange: (e)=>setEmail(e.target.value),
                            className: "mb-4 w-full border border-line px-3 py-2 font-body text-sm text-ink"
                        }, void 0, false, {
                            fileName: "[project]/app/signin/page.tsx",
                            lineNumber: 84,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            className: "mb-1 block font-body text-xs text-slate",
                            children: "Password"
                        }, void 0, false, {
                            fileName: "[project]/app/signin/page.tsx",
                            lineNumber: 91,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "password",
                            required: true,
                            minLength: mode === "register" ? 8 : undefined,
                            value: password,
                            onChange: (e)=>setPassword(e.target.value),
                            className: "mb-4 w-full border border-line px-3 py-2 font-body text-sm text-ink"
                        }, void 0, false, {
                            fileName: "[project]/app/signin/page.tsx",
                            lineNumber: 92,
                            columnNumber: 11
                        }, this),
                        error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-4 font-body text-xs text-rust",
                            children: error
                        }, void 0, false, {
                            fileName: "[project]/app/signin/page.tsx",
                            lineNumber: 100,
                            columnNumber: 21
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "submit",
                            disabled: busy,
                            className: "w-full bg-teal py-2 font-body text-sm text-white hover:bg-teal/90 disabled:opacity-50",
                            children: mode === "signin" ? "Sign in" : "Create account"
                        }, void 0, false, {
                            fileName: "[project]/app/signin/page.tsx",
                            lineNumber: 101,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/signin/page.tsx",
                    lineNumber: 71,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: ()=>{
                        setMode(mode === "signin" ? "register" : "signin");
                        setError(null);
                    },
                    className: "mt-4 w-full font-body text-xs text-slate hover:text-ink",
                    children: mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"
                }, void 0, false, {
                    fileName: "[project]/app/signin/page.tsx",
                    lineNumber: 110,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/signin/page.tsx",
            lineNumber: 53,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/signin/page.tsx",
        lineNumber: 52,
        columnNumber: 5
    }, this);
}
function SignInPage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Suspense"], {
        fallback: null,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SignInForm, {}, void 0, false, {
            fileName: "[project]/app/signin/page.tsx",
            lineNumber: 127,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/signin/page.tsx",
        lineNumber: 126,
        columnNumber: 5
    }, this);
}
}),
"[project]/lib/api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "approveStep",
    ()=>approveStep,
    "createQuickRequest",
    ()=>createQuickRequest,
    "createVendor",
    ()=>createVendor,
    "exportPurchaseOrder",
    ()=>exportPurchaseOrder,
    "fetchComparisonMatrix",
    ()=>fetchComparisonMatrix,
    "fetchMyRequests",
    ()=>fetchMyRequests,
    "fetchPendingApprovals",
    ()=>fetchPendingApprovals,
    "fetchPurchaseOrder",
    ()=>fetchPurchaseOrder,
    "fetchPurchaseRequest",
    ()=>fetchPurchaseRequest,
    "fetchRfqs",
    ()=>fetchRfqs,
    "fetchVendors",
    ()=>fetchVendors,
    "registerAccount",
    ()=>registerAccount,
    "rejectStep",
    ()=>rejectStep
]);
const API_BASE = ("TURBOPACK compile-time value", "http://localhost:4000/api") ?? "http://localhost:4000/api";
async function registerAccount(name, email, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name,
            email,
            password
        })
    });
    if (!res.ok) {
        const body = await res.json().catch(()=>({}));
        throw new Error(body.error ?? `Registration failed: ${res.status}`);
    }
}
function authHeaders(token) {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    };
}
async function fetchPendingApprovals(token) {
    const res = await fetch(`${API_BASE}/approval-steps`, {
        headers: authHeaders(token),
        cache: "no-store"
    });
    if (!res.ok) throw new Error(`Failed to load approvals: ${res.status}`);
    return res.json();
}
async function fetchPurchaseRequest(token, id) {
    const res = await fetch(`${API_BASE}/purchase-requests/${id}`, {
        headers: authHeaders(token),
        cache: "no-store"
    });
    if (!res.ok) throw new Error(`Failed to load request ${id}: ${res.status}`);
    return res.json();
}
async function approveStep(token, stepId, comments) {
    const res = await fetch(`${API_BASE}/approval-steps/${stepId}/approve`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
            comments
        })
    });
    if (!res.ok) throw new Error(`Approve failed: ${res.status}`);
    return res.json();
}
async function rejectStep(token, stepId, comments) {
    const res = await fetch(`${API_BASE}/approval-steps/${stepId}/reject`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({
            comments
        })
    });
    if (!res.ok) throw new Error(`Reject failed: ${res.status}`);
}
async function fetchVendors(token, category) {
    const res = await fetch(`${API_BASE}/vendors${category ? `?category=${category}` : ""}`, {
        headers: authHeaders(token),
        cache: "no-store"
    });
    if (!res.ok) throw new Error(`Failed to load vendors: ${res.status}`);
    return res.json();
}
async function fetchComparisonMatrix(token, rfqId) {
    const res = await fetch(`${API_BASE}/rfqs/${rfqId}/comparison`, {
        headers: authHeaders(token),
        cache: "no-store"
    });
    if (!res.ok) throw new Error(`Failed to load comparison: ${res.status}`);
    return res.json();
}
async function fetchMyRequests(token) {
    const res = await fetch(`${API_BASE}/purchase-requests`, {
        headers: authHeaders(token),
        cache: "no-store"
    });
    if (!res.ok) throw new Error(`Failed to load your requests: ${res.status}`);
    return res.json();
}
async function fetchRfqs(token) {
    const res = await fetch(`${API_BASE}/rfqs`, {
        headers: authHeaders(token),
        cache: "no-store"
    });
    if (!res.ok) throw new Error(`Failed to load RFQs: ${res.status}`);
    return res.json();
}
async function createVendor(token, data) {
    const res = await fetch(`${API_BASE}/vendors`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Failed to create vendor: ${res.status}`);
    return res.json();
}
async function fetchPurchaseOrder(token, purchaseRequestId) {
    const res = await fetch(`${API_BASE}/purchase-requests/${purchaseRequestId}/po`, {
        headers: authHeaders(token),
        cache: "no-store"
    });
    if (!res.ok) {
        const body = await res.json().catch(()=>({}));
        throw new Error(body.error ?? `Failed to load purchase order: ${res.status}`);
    }
    return res.json();
}
async function exportPurchaseOrder(token, purchaseRequestId) {
    const res = await fetch(`${API_BASE}/purchase-requests/${purchaseRequestId}/export`, {
        method: "POST",
        headers: authHeaders(token)
    });
    if (!res.ok) throw new Error(`Export failed: ${res.status}`);
    return res.json();
}
async function createQuickRequest(token, data) {
    const res = await fetch(`${API_BASE}/purchase-requests/quick`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const body = await res.json().catch(()=>({}));
        throw new Error(body.error ?? `Failed to create request: ${res.status}`);
    }
    return res.json();
}
}),
];

//# sourceMappingURL=_1o-3q9o._.js.map