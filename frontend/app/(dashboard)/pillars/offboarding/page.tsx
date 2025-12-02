import { UserMinus } from "lucide-react";
import { PillarPage } from "@/components/PillarPage";

export default function OffboardingPage() {
    return (
        <PillarPage
            pillarName="Offboarding"
            pillarCategory="Offboarding"
            pillarDescription="Manage employee exits, exit interviews, and knowledge transfer"
            pillarIcon={<UserMinus size={28} />}
        />
    );
}
