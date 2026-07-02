import { getTemplates, Template } from "@/modules/template/api";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { createContract } from "../api";
import { toast } from "sonner";

export function useNewContractForm() {
  const [template, setTemplate] = useState<Template | null | undefined>(undefined);

  useEffect(() => {
    let ignore = false;

    getTemplates()
      .then((templates) => {
        if (ignore) return;
        setTemplate(templates.find((t) => t.isActive) ?? null);
      })
      .catch(() => {
        if (!ignore) setTemplate(null);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { template };
}
