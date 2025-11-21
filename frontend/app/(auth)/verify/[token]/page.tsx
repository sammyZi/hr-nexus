"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Link from "next/link";

export default function VerifyPage() {
    const params = useParams();
    const router = useRouter();
    const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

    useEffect(() => {
        if (params.token) {
            axios.get(`http://localhost:8000/auth/verify/${params.token}`)
                .then(() => {
                    setStatus("success");
                    setTimeout(() => router.push("/login"), 3000);
                })
                .catch(() => setStatus("error"));
        }
    }, [params.token, router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted p-4">
            <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-lg text-center">
                {status === "verifying" && (
                    <>
                        <h2 className="text-2xl font-bold mb-4">Verifying...</h2>
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </>
                )}
                {status === "success" && (
                    <>
                        <h2 className="text-2xl font-bold text-success mb-4">Verified!</h2>
                        <p className="text-muted-foreground">Your email has been verified. Redirecting to login...</p>
                        <Link href="/login" className="mt-4 inline-block text-primary hover:underline">Go to Login</Link>
                    </>
                )}
                {status === "error" && (
                    <>
                        <h2 className="text-2xl font-bold text-destructive mb-4">Verification Failed</h2>
                        <p className="text-muted-foreground">Invalid or expired token.</p>
                        <Link href="/signup" className="mt-4 inline-block text-primary hover:underline">Back to Signup</Link>
                    </>
                )}
            </div>
        </div>
    );
}
