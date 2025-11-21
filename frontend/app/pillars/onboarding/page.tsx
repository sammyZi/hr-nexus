import { UserPlus } from "lucide-react";
import { PillarPage } from "@/components/PillarPage";

export default function OnboardingPage() {
    return (
        <PillarPage
            pillarName="Onboarding"
            pillarCategory="Onboarding"
            pillarDescription="Streamline new employee onboarding and orientation"
            pillarIcon={<UserPlus size={28} />}
        />
    );
}
