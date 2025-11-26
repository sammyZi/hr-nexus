import { DollarSign } from "lucide-react";
import { PillarPage } from "@/components/PillarPage";

export default function PayrollPage() {
    return (
        <PillarPage
            pillarName="Payroll"
            pillarCategory="Payroll"
            pillarDescription="Process payroll, manage compensation, and handle tax compliance"
            pillarIcon={<DollarSign size={28} />}
        />
    );
}
