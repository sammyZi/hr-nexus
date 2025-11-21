"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Briefcase, UserPlus, DollarSign, Heart, GraduationCap, Users, TrendingUp, UserMinus, Bot } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("access_token");
    if (!token) {
      // Redirect to signin if not logged in
      router.push("/signin");
    } else {
      // Redirect to dashboard if logged in
      router.push("/dashboard");
    }
  }, [router]);

  return null; // This will redirect in useEffect
}
