import { Heart } from "lucide-react";
import { PillarPage } from "@/components/PillarPage";

export default function BenefitsPage() {
    return (
        <PillarPage
            pillarName="Benefits"
            pillarCategory="Benefits"
            pillarDescription="Manage employee benefits, insurance, and wellness programs"
            pillarIcon={<Heart size={28} />}
        />
    );
}
